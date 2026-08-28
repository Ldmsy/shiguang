import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AGENT_RULE_VERSION, buildChatSystemPrompt } from './agent/prompt.mjs';
import { safetyRoute } from './agent/safety.mjs';
import { CloudJsonStore, CloudUserStore, JsonStore, createCloudDatabase } from './store.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '../../新版网页');
const dataDir = process.env.DATA_DIR ? normalize(process.env.DATA_DIR) : join(here, '../../.data');
const usersFile = join(dataDir, 'users.json');
const cloudDatabase = createCloudDatabase(process.env.CLOUDBASE_ENV_ID, process.env.CLOUDBASE_APIKEY);
const appStore = cloudDatabase ? new CloudJsonStore(cloudDatabase) : new JsonStore(join(dataDir, 'app.json'));
const cloudUsers = cloudDatabase ? new CloudUserStore(cloudDatabase) : null;
const sessions = new Map();
const codes = new Map();
const temporaryExpressionSignals = new Map();
const CHAT_SYSTEM_PROMPT = buildChatSystemPrompt();

export function createApp() {
  return createServer(async (req, res) => {
    try {
      if ((req.url || '').startsWith('/api/v1/')) {
        const handled = await v1(req, res);
        if (handled) return;
      }
      if (req.method === 'POST' && req.url === '/api/auth/request-code') return requestCode(req, res);
      if (req.method === 'POST' && req.url === '/api/auth/register') return register(req, res);
      if (req.method === 'POST' && req.url === '/api/auth/login') return login(req, res);
      if (req.method === 'POST' && req.url === '/api/chat') return chat(req, res);
      if (req.method === 'POST' && req.url === '/api/comfort') return comfortRoute(req, res);
      return serveStatic(req, res);
    } catch (error) {
      console.error(error);
      return json(res, 500, { code: 'SERVER_ERROR', message: '服务暂时不可用，请稍后重试。' });
    }
  });
}

async function v1(req, res) {
  const url = new URL(req.url, 'http://local');
  const path = url.pathname;
  if (req.method === 'POST' && path === '/api/v1/auth/code/request') return requestCode(req, res), true;
  if (req.method === 'POST' && path === '/api/v1/auth/register') return register(req, res), true;
  if (req.method === 'POST' && path === '/api/v1/auth/login/password') return login(req, res), true;
  if (req.method === 'POST' && path === '/api/v1/auth/login/code') return login(req, res), true;
  const session = authenticatedSession(req);
  if (!session) { json(res, 401, { code: 'UNAUTHORIZED', message: '登录状态已失效，请重新登录。' }); return true; }
  const userId = session.userId;
  if (req.method === 'GET' && path === '/api/v1/auth/session') {
    const user = (await loadUsers()).find(item => item.id === userId);
    json(res, 200, { user: { id: user.id, phone: user.phone } }); return true;
  }
  if (req.method === 'POST' && path === '/api/v1/auth/logout') {
    revokeRequestSession(req); json(res, 200, { ok: true }); return true;
  }
  if (path === '/api/v1/me' && req.method === 'GET') {
    const data = await appStore.read();
    json(res, 200, { profile: profileFor(data, userId) }); return true;
  }
  if ((path === '/api/v1/me' && req.method === 'PATCH') || (path === '/api/v1/me/onboarding' && req.method === 'POST')) {
    const input = await body(req);
    const profile = await appStore.mutate(data => upsertProfile(data, userId, input, path.endsWith('onboarding')));
    json(res, 200, { profile }); return true;
  }
  if (path === '/api/v1/settings/card-schedule' && req.method === 'GET') {
    const data = await appStore.read(); json(res, 200, { schedule: settingsFor(data, userId).cardSchedule }); return true;
  }
  if (path === '/api/v1/settings/card-schedule' && req.method === 'PUT') {
    const input = await body(req);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.localTime || '')) { json(res, 422, { code: 'INVALID_TIME', message: '每日生成时间格式不正确。' }); return true; }
    const schedule = await appStore.mutate(data => { const s = settingsFor(data, userId); s.cardSchedule = { enabled: input.enabled !== false, localTime: input.localTime, timezone: input.timezone || 'Asia/Shanghai' }; return s.cardSchedule; });
    json(res, 200, { schedule }); return true;
  }
  if (path === '/api/v1/privacy/settings' && req.method === 'GET') {
    const data = await appStore.read(); json(res, 200, { privacy: settingsFor(data, userId).privacy }); return true;
  }
  if (path === '/api/v1/privacy/settings' && req.method === 'PATCH') {
    const input = await body(req);
    const privacy = await appStore.mutate(data => { const s = settingsFor(data, userId); s.privacy = { ...s.privacy, ...pick(input, ['voiceInput', 'expressionAssist', 'longTermMemory', 'anonymousImprovement']) }; return s.privacy; });
    if (privacy.expressionAssist === false) for (const key of temporaryExpressionSignals.keys()) if (key.startsWith(`${userId}:`)) temporaryExpressionSignals.delete(key);
    json(res, 200, { privacy }); return true;
  }
  if (path === '/api/v1/conversations' && req.method === 'GET') {
    const data = await appStore.read();
    const conversations = data.conversations.filter(x => x.userId === userId && !x.deletedAt).sort((a,b) => b.updatedAt-a.updatedAt).map(c => ({ ...c, messageCount: data.messages.filter(m => m.conversationId === c.id).length }));
    json(res, 200, { conversations }); return true;
  }
  if (path === '/api/v1/conversations' && req.method === 'POST') {
    const input = await body(req); const now = Date.now();
    const conversation = await appStore.mutate(data => { const c = { id: newId('talk'), userId, title: cleanText(input.title, 80) || '尚未命名的新对话', mood: cleanText(input.mood, 20) || '平静', createdAt: now, updatedAt: now }; data.conversations.push(c); return c; });
    json(res, 201, { conversation }); return true;
  }
  const conversationMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)$/);
  if (conversationMatch && req.method === 'GET') {
    const data = await appStore.read(); const conversation = owned(data.conversations, conversationMatch[1], userId);
    if (!conversation) { json(res, 404, { code: 'NOT_FOUND', message: '对话不存在。' }); return true; }
    json(res, 200, { conversation, messages: data.messages.filter(m => m.conversationId === conversation.id) }); return true;
  }
  if (conversationMatch && req.method === 'PATCH') {
    const input = await body(req); const conversation = await appStore.mutate(data => { const c = owned(data.conversations, conversationMatch[1], userId); if (!c) return null; Object.assign(c, pick(input, ['title','mood']), { updatedAt: Date.now() }); return c; });
    json(res, conversation ? 200 : 404, conversation ? { conversation } : { code:'NOT_FOUND', message:'对话不存在。' }); return true;
  }
  if (conversationMatch && req.method === 'DELETE') {
    const found = await appStore.mutate(data => { const c = owned(data.conversations, conversationMatch[1], userId); if (!c) return false; c.deletedAt = Date.now(); return true; });
    json(res, found ? 200 : 404, found ? { ok:true } : { code:'NOT_FOUND', message:'对话不存在。' }); return true;
  }
  const messageMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)\/messages$/);
  if (messageMatch && req.method === 'POST') return conversationMessage(req, res, userId, messageMatch[1]), true;
  const signalMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)\/signals$/);
  if (signalMatch && req.method === 'POST') {
    const input = await body(req); const data = await appStore.read(); const conversation = owned(data.conversations, signalMatch[1], userId);
    if (!conversation) { json(res,404,{code:'NOT_FOUND',message:'对话不存在。'}); return true; }
    if (!settingsFor(data,userId).privacy.expressionAssist) { json(res,403,{code:'CONSENT_REQUIRED',message:'请先主动开启本次表情辅助。'}); return true; }
    const allowed = ['calm','tired','tense','positive','uncertain'];
    if (!allowed.includes(input.label) || !unitNumber(input.intensity) || !unitNumber(input.confidence)) { json(res,422,{code:'INVALID_SIGNAL',message:'临时表情信号格式不正确。'}); return true; }
    const signal={label:input.label,intensity:input.intensity,confidence:Math.min(input.confidence,.8),source:'on_device_expression',createdAt:Date.now(),expiresAt:Date.now()+10*60_000};
    temporaryExpressionSignals.set(`${userId}:${conversation.id}`,signal); json(res,200,{signal}); return true;
  }
  if (signalMatch && req.method === 'DELETE') { temporaryExpressionSignals.delete(`${userId}:${signalMatch[1]}`); json(res,200,{ok:true}); return true; }
  if (path === '/api/v1/cards' && req.method === 'GET') {
    const data = await appStore.read(); const month = url.searchParams.get('month');
    const cards = data.cards.filter(x => x.userId === userId && (!month || new Date(x.createdAt).toISOString().startsWith(month))).sort((a,b)=>b.createdAt-a.createdAt);
    json(res, 200, { cards }); return true;
  }
  const cardMatch = path.match(/^\/api\/v1\/cards\/([^/]+)$/);
  if (cardMatch && req.method === 'GET') { const data=await appStore.read(); const card=owned(data.cards,cardMatch[1],userId); json(res,card?200:404,card?{card}:{code:'NOT_FOUND',message:'卡片不存在。'}); return true; }
  if (path === '/api/v1/profile/signals' && req.method === 'GET') { const data=await appStore.read(); json(res,200,{signals:data.abilities.filter(x=>x.userId===userId)}); return true; }
  if (path === '/api/v1/insights/refresh' && req.method === 'POST') return refreshInsights(res,userId),true;
  if (path === '/api/v1/reports/monthly' && req.method === 'GET') { const data=await appStore.read(); const month=url.searchParams.get('month'); const report=data.reports.find(x=>x.userId===userId&&x.month===month); json(res,200,{report:report||null}); return true; }
  if (path === '/api/v1/directions' && req.method === 'GET') { const data=await appStore.read();json(res,200,{directions:data.directions.filter(x=>x.userId===userId)}); return true; }
  if (path === '/api/v1/people/recommendations' && req.method === 'GET') { const data=await appStore.read();const people=data.profiles.filter(x=>x.userId!==userId&&x.discoveryVisible===true).map(x=>({id:x.userId,name:x.name,city:x.city,bio:x.bio,publicInterests:x.interests||[]}));json(res,200,{people}); return true; }
  if (path === '/api/v1/exports' && req.method === 'POST') {
    const input=await body(req); const job=await appStore.mutate(data=>{const e={id:newId('export'),userId,format:['txt','json'].includes(input.format)?input.format:'json',status:'ready',createdAt:Date.now()};data.exports.push(e);return e}); json(res,201,{export:job}); return true;
  }
  json(res, 404, { code: 'NOT_FOUND', message: '接口不存在。' }); return true;
}

async function requestCode(req, res) {
  const { phone } = await body(req);
  if (!validPhone(phone)) return json(res, 422, { code: 'INVALID_PHONE', message: '请输入正确的中国大陆手机号。' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(phone, { code, expiresAt: Date.now() + 5 * 60_000 });
  return json(res, 200, { ok: true, message: '页面验证码已生成，5 分钟内有效。', devCode: code });
}

async function register(req, res) {
  const { phone, password, code } = await body(req);
  if (!validPhone(phone)) return json(res, 422, { code: 'INVALID_PHONE', message: '请输入正确手机号。' });
  if (typeof password !== 'string' || password.length < 8) return json(res, 422, { code: 'WEAK_PASSWORD', message: '密码至少需要 8 位。' });
  const savedCode = codes.get(phone);
  if (!savedCode || savedCode.code !== code || savedCode.expiresAt < Date.now()) return json(res, 422, { code: 'INVALID_CODE', message: '验证码不正确或已过期。' });
  const users = await loadUsers();
  if (users.some((user) => user.phone === phone)) return json(res, 409, { code: 'PHONE_EXISTS', message: '该手机号已经注册。' });
  const salt = randomBytes(16).toString('hex');
  const user = { id: randomBytes(12).toString('hex'), phone, salt, passwordHash: hashPassword(password, salt), createdAt: new Date().toISOString() };
  users.push(user); await saveUsers(users); codes.delete(phone);
  return authSuccess(res, user);
}

async function login(req, res) {
  const { phone, password, code } = await body(req);
  const user = (await loadUsers()).find((item) => item.phone === phone);
  if (!user) return json(res, 401, { code: 'INVALID_CREDENTIALS', message: '账号不存在，请先注册。' });
  if (typeof code === 'string' && code) {
    const savedCode = codes.get(phone);
    if (!savedCode || savedCode.code !== code || savedCode.expiresAt < Date.now()) return json(res, 401, { code: 'INVALID_CODE', message: '验证码不正确或已过期。' });
    codes.delete(phone);
  } else if (typeof password !== 'string' || !sameHash(hashPassword(password, user.salt), user.passwordHash)) return json(res, 401, { code: 'INVALID_CREDENTIALS', message: '账号或密码不正确。' });
  return authSuccess(res, user);
}

function authSuccess(res, user) {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + 7 * 86400_000 });
  return json(res, 200, { token, user: { id: user.id, phone: user.phone } });
}

async function chat(req, res) {
  const startedAt = Date.now();
  const session = authenticatedSession(req);
  if (!session) return json(res, 401, { code: 'UNAUTHORIZED', message: '登录状态已失效，请重新登录。' });
  const apiKey = modelApiKey();
  if (!apiKey) return json(res, 503, { code: 'MODEL_NOT_CONFIGURED', message: '尚未在服务端配置模型密钥。' });
  const messages = (await body(req))?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30 || !messages.every(validMessage)) return json(res, 422, { code: 'INVALID_MESSAGES', message: '对话内容无效或过长。' });
  const safety = safetyRoute(messages);
  if (safety.routed) return json(res, safety.status, safety.body);
  const upstream = await fetch(modelChatUrl(), { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: modelName(), messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages], thinking: { type: 'disabled' }, stream: true, max_tokens: 700, temperature: 0.7 }), signal: AbortSignal.timeout(90_000) });
  if (!upstream.ok || !upstream.body) return json(res, 502, { code: 'MODEL_UNAVAILABLE', message: upstream.status === 401 ? 'DeepSeek 密钥无效。' : '模型服务暂时不可用。' });
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-agent-rule-version': AGENT_RULE_VERSION, 'x-agent-task': 'chat_reply' });
  const reader = upstream.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
  try { while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data: ') || line === 'data: [DONE]') continue; try { const part = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (part) res.write(part); } catch {} } } } finally { reader.releaseLock(); res.end(); console.info(JSON.stringify({ event: 'agent_call', task: 'chat_reply', ruleVersion: AGENT_RULE_VERSION, model: modelName(), latencyMs: Date.now() - startedAt, ok: true })); }
}

async function conversationMessage(req, res, userId, conversationId) {
  const input = await body(req); const content = cleanText(input.content, 4000);
  if (!content) return json(res, 422, { code:'INVALID_MESSAGE', message:'请输入对话内容。' });
  const data = await appStore.read(); const conversation = owned(data.conversations, conversationId, userId);
  if (!conversation) return json(res, 404, { code:'NOT_FOUND', message:'对话不存在。' });
  const history = data.messages.filter(m => m.conversationId === conversationId).slice(-29).map(m => ({ role:m.role, content:m.content }));
  const messages = [...history, { role:'user', content }]; const safety = safetyRoute(messages);
  if (safety.routed) return json(res, safety.status, safety.body);
  const apiKey = modelApiKey();
  if (!apiKey) return json(res,503,{code:'MODEL_NOT_CONFIGURED',message:'尚未配置模型。'});
  const userMessage = { id:newId('msg'), userId, conversationId, role:'user', content, createdAt:Date.now() };
  await appStore.mutate(db => { db.messages.push(userMessage); conversationIn(db, conversationId).updatedAt=Date.now(); });
  const temporarySignal=activeExpressionSignal(userId,conversationId);
  const signalContext=temporarySignal?{role:'system',content:`设备端临时表情辅助信号（低可信数据，不是用户事实或诊断）：${temporarySignal.label}，强度 ${temporarySignal.intensity}，置信度 ${temporarySignal.confidence}。仅用于适当放缓或柔化语气；不得据此断言情绪、心理状态或覆盖用户本轮自述。`}:null;
  const upstream = await fetch(modelChatUrl(),{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},body:JSON.stringify({model:modelName(),messages:[{role:'system',content:CHAT_SYSTEM_PROMPT},...(signalContext?[signalContext]:[]),...messages],thinking:{type:'disabled'},stream:true,max_tokens:700,temperature:.7}),signal:AbortSignal.timeout(90_000)});
  if(!upstream.ok||!upstream.body)return json(res,502,{code:'MODEL_UNAVAILABLE',message:'模型服务暂时不可用。'});
  res.writeHead(200,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-agent-rule-version':AGENT_RULE_VERSION,'x-message-id':userMessage.id});
  const reader=upstream.body.getReader(),decoder=new TextDecoder();let buffer='',reply='';
  try{while(true){const{value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()||'';for(const line of lines){if(!line.startsWith('data: ')||line==='data: [DONE]')continue;try{const part=JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;if(part){reply+=part;res.write(part)}}catch{}}}}finally{reader.releaseLock();res.end();if(reply)await appStore.mutate(db=>{db.messages.push({id:newId('msg'),userId,conversationId,role:'assistant',content:reply,createdAt:Date.now()});const c=conversationIn(db,conversationId);c.updatedAt=Date.now();if(c.title==='尚未命名的新对话')c.title=content.slice(0,24)});}
}

function authenticatedSession(req) {
  const match = /^Bearer\s+([a-f0-9]+)$/i.exec(req.headers.authorization || '');
  if (!match) return null;
  const session = sessions.get(match[1]);
  if (!session || session.expiresAt < Date.now()) { sessions.delete(match[1]); return null; }
  return session;
}

function revokeRequestSession(req) { const match=/^Bearer\s+([a-f0-9]+)$/i.exec(req.headers.authorization||''); if(match)sessions.delete(match[1]); }
function modelApiKey(){return process.env.MODEL_API_KEY||process.env.QINIU_API_KEY||process.env.DEEPSEEK_API_KEY}
function modelName(){return process.env.MODEL_NAME||process.env.DEEPSEEK_MODEL||'deepseek-v4-flash'}
function modelChatUrl(){return `${(process.env.MODEL_BASE_URL||process.env.DEEPSEEK_API_BASE_URL||process.env.QINIU_API_BASE_URL||'https://api.deepseek.com/v1').replace(/\/$/,'')}/chat/completions`}
async function refreshInsights(res,userId){
  const data=await appStore.read();
  const source=data.messages.filter(x=>x.userId===userId&&x.role==='user').slice(-80);
  if(!source.length)return json(res,422,{code:'NO_SOURCE_MESSAGES',message:'还没有足够的真实对话可以整理。'});
  const apiKey=modelApiKey();if(!apiKey)return json(res,503,{code:'MODEL_NOT_CONFIGURED',message:'尚未配置模型。'});
  const transcript=source.map((x,i)=>`${i+1}. ${cleanText(x.content,1200)}`).join('\n');
  const prompt=`你是“时光”的证据整理器。只根据下面用户亲口说过的内容提取信息，不得补写、猜测或虚构事件。返回严格 JSON，不要 Markdown。结构：{"abilities":[{"label":"能力名","category":"感知/组织/关系/创造/沟通/行动/思考/表达","confidence":0到100整数,"evidence":"用户真实提到的具体事件，使用第二人称复述"}],"directions":[{"title":"方向名称","summary":"为什么来自这些真实证据"}],"monthlyReport":{"title":"一句总结","summary":"只概括已出现的变化","keywords":["词1","词2"]}}。能力最多8条、方向最多3条；证据不足就返回空数组，不要为了填满而创造。\n\n真实对话：\n${transcript}`;
  const response=await fetch(modelChatUrl(),{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},body:JSON.stringify({model:modelName(),messages:[{role:'system',content:'你只输出可解析的 JSON，并严格遵守证据边界。'},{role:'user',content:prompt}],stream:false,max_tokens:1800,temperature:.15}),signal:AbortSignal.timeout(90_000)});
  if(!response.ok)return json(res,502,{code:'MODEL_UNAVAILABLE',message:'AI 暂时无法整理真实数据。'});
  const payload=await response.json();const content=payload.choices?.[0]?.message?.content||'';
  let parsed;try{parsed=JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g,''))}catch{return json(res,502,{code:'INVALID_MODEL_OUTPUT',message:'AI 返回的数据格式暂时无法使用。'});}
  const now=Date.now(),month=new Date().toISOString().slice(0,7);
  const abilities=(Array.isArray(parsed.abilities)?parsed.abilities:[]).slice(0,8).map((x,i)=>({id:`ability_${i}_${now}`,userId,label:cleanText(x.label,30),category:cleanText(x.category,20),confidence:Math.max(0,Math.min(100,Math.round(Number(x.confidence)||0))),evidence:cleanText(x.evidence,300),sourceMessageIds:source.map(m=>m.id).filter(Boolean),updatedAt:now})).filter(x=>x.label&&x.evidence);
  const directions=(Array.isArray(parsed.directions)?parsed.directions:[]).slice(0,3).map((x,i)=>({id:`direction_${i}_${now}`,userId,title:cleanText(x.title,60),summary:cleanText(x.summary,300),updatedAt:now})).filter(x=>x.title&&x.summary);
  const reportInput=parsed.monthlyReport||{};const report={id:`report_${month}_${now}`,userId,month,title:cleanText(reportInput.title,100),summary:cleanText(reportInput.summary,1000),keywords:(Array.isArray(reportInput.keywords)?reportInput.keywords:[]).slice(0,6).map(x=>cleanText(x,30)).filter(Boolean),updatedAt:now};
  await appStore.mutate(db=>{db.abilities=db.abilities.filter(x=>x.userId!==userId);db.abilities.push(...abilities);db.directions=db.directions.filter(x=>x.userId!==userId);db.directions.push(...directions);db.reports=db.reports.filter(x=>!(x.userId===userId&&x.month===month));if(report.title||report.summary)db.reports.push(report)});
  return json(res,200,{abilities,directions,report:report.title||report.summary?report:null,sourceCount:source.length,generatedAt:now});
}
function newId(prefix){return `${prefix}_${randomBytes(10).toString('hex')}`}
function unitNumber(value){return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1}
function activeExpressionSignal(userId,conversationId){const key=`${userId}:${conversationId}`,signal=temporaryExpressionSignals.get(key);if(!signal)return null;if(signal.expiresAt<Date.now()){temporaryExpressionSignals.delete(key);return null}return signal}
function cleanText(value,max){return typeof value==='string'?value.trim().slice(0,max):''}
function pick(value,keys){return Object.fromEntries(keys.filter(k=>Object.hasOwn(value||{},k)).map(k=>[k,value[k]]))}
function owned(items,id,userId){return items.find(x=>x.id===id&&x.userId===userId&&!x.deletedAt)}
function conversationIn(data,id){return data.conversations.find(x=>x.id===id)}
function profileFor(data,userId){return data.profiles.find(x=>x.userId===userId)||{userId,name:'',birthday:'',city:'',bio:'',interests:[],onboardingComplete:false}}
function upsertProfile(data,userId,input,onboarding=false){let p=data.profiles.find(x=>x.userId===userId);if(!p){p={userId,name:'',birthday:'',city:'',bio:'',interests:[],onboardingComplete:false};data.profiles.push(p)}for(const key of ['name','birthday','city','bio'])if(Object.hasOwn(input,key))p[key]=cleanText(input[key],key==='bio'?500:80);if(Object.hasOwn(input,'interests'))p.interests=Array.isArray(input.interests)?input.interests.slice(0,20).map(x=>cleanText(x,40)):cleanText(input.interests,400).split(/[、,，]/).filter(Boolean);if(onboarding)p.onboardingComplete=true;p.updatedAt=Date.now();return p}
function settingsFor(data,userId){let s=data.settings.find(x=>x.userId===userId);if(!s){s={userId,cardSchedule:{enabled:true,localTime:'21:30',timezone:'Asia/Shanghai'},privacy:{voiceInput:true,expressionAssist:false,longTermMemory:true,anonymousImprovement:false}};data.settings.push(s)}return s}

async function comfortRoute(req, res) { const result = comfort(await body(req)); return json(res, result.status, result.body); }
export function comfort(input) { if (typeof input?.event !== 'string' || !input.event.trim()) return { status: 422, body: { code: 'INVALID_EVENT', message: '请先写下一件事' } }; return { status: 200, body: { reply: `我听见了：${input.event.trim()}`, actions: ['慢慢呼吸三次', '写下一件今天已经做到的小事'], contractVersion: '0.1.0' } }; }

async function serveStatic(req, res) {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = requested === '/' ? 'index.html' : normalize(requested).replace(/^[/\\]+/, '');
  const target = join(webDir, relative);
  if (!target.startsWith(webDir)) return json(res, 403, { code: 'FORBIDDEN', message: '禁止访问。' });
  try { const content = await readFile(target); const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' }[extname(target)] || 'application/octet-stream'; res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' }); res.end(content); } catch { return json(res, 404, { code: 'NOT_FOUND', message: '页面不存在' }); }
}

async function body(req) { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 150_000) throw new Error('PAYLOAD_TOO_LARGE'); } return JSON.parse(raw || '{}'); }
function validPhone(phone) { return typeof phone === 'string' && /^1[3-9]\d{9}$/.test(phone); }
function validMessage(value) { return value && (value.role === 'user' || value.role === 'assistant') && typeof value.content === 'string' && value.content.length <= 4000; }
function hashPassword(password, salt) { return scryptSync(password, salt, 64).toString('hex'); }
function sameHash(a, b) { try { return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')); } catch { return false; } }
async function loadUsers() { if (cloudUsers) return cloudUsers.read(); if (!existsSync(usersFile)) return []; return JSON.parse(await readFile(usersFile, 'utf8')); }
async function saveUsers(users) { if (cloudUsers) return cloudUsers.save(users); await mkdir(dataDir, { recursive: true }); await writeFile(usersFile, JSON.stringify(users, null, 2)); }
function json(res, status, data) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-agent-rule-version': AGENT_RULE_VERSION }); res.end(JSON.stringify(data)); }

if (process.argv[1] === fileURLToPath(import.meta.url)) createApp().listen(Number(process.env.PORT || 4173), () => console.log(`时光初版：http://127.0.0.1:${process.env.PORT || 4173}`));
