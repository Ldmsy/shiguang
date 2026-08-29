(() => {
  window.__SHIGUANG_DEMO__ = true;

  const STORE_KEY = 'shiguang-flutter-demo-api-v1';
  const now = new Date();
  const iso = (day, hour = 12) => new Date(now.getFullYear(), now.getMonth(), day, hour).toISOString();
  const seed = {
    profile: {
      id: 'demo-user', name: '林溪', phone: '13800138000', birthday: '1993-05-18', city: '上海',
      bio: '喜欢植物、整理和记录生活。', interests: ['植物照护', '社区分享', '手作'], onboardingComplete: true,
    },
    conversations: [
      { id: 'conv-1', title: '阳台植物与生活节奏', mood: '平静', createdAt: iso(27, 20), updatedAt: iso(27, 21), messageCount: 6 },
      { id: 'conv-2', title: '把零散经验整理成方法', mood: '轻松', createdAt: iso(19, 19), updatedAt: iso(19, 20), messageCount: 4 },
      { id: 'conv-3', title: '社区分享的小计划', mood: '开心', createdAt: iso(12, 18), updatedAt: iso(12, 19), messageCount: 5 },
    ],
    messages: {
      'conv-1': [
        { role: 'assistant', content: '我在这里。今天想从哪里开始说起？' },
        { role: 'user', content: '我重新整理了阳台上的植物，忽然觉得生活也有了秩序。' },
        { role: 'assistant', content: '你在照顾植物的同时，也在为自己建立一种可以呼吸的节奏。哪一个细节最让你满意？' },
      ],
    },
    cards: [
      { id: 'card-1', title: '让杂乱重新有秩序', mood: '平静', createdAt: iso(3, 21), summary: '你把观察变成了清晰而温柔的行动。' },
      { id: 'card-2', title: '我其实一直在坚持', mood: '轻松', createdAt: iso(12, 21), summary: '重复的小事，也在形成可靠的能力。' },
      { id: 'card-3', title: '让邻居也能看懂', mood: '开心', createdAt: iso(19, 21), summary: '你擅长把经验整理成别人容易理解的方法。' },
      { id: 'card-4', title: '今天的一点新发现', mood: '平静', createdAt: iso(27, 21), summary: '照顾与创造在你的生活里连在了一起。' },
    ],
    abilities: [
      { id: 'a1', label: '细致观察', category: '感知', confidence: 92, evidence: '能持续记录植物状态，并发现环境变化。' },
      { id: 'a2', label: '整理归纳', category: '思考', confidence: 89, evidence: '把零散照护经验整理成清楚步骤。' },
      { id: 'a3', label: '耐心照护', category: '行动', confidence: 91, evidence: '长期稳定地照料植物与生活空间。' },
      { id: 'a4', label: '清晰表达', category: '沟通', confidence: 84, evidence: '会把复杂的方法改写成邻居也能看懂的说明。' },
      { id: 'a5', label: '共情倾听', category: '关系', confidence: 82, evidence: '分享时会先理解对方的实际困难。' },
    ],
    directions: [
      { id: 'd1', title: '城市植物照护笔记', summary: '把日常观察整理成轻量、可信的照护内容。' },
      { id: 'd2', title: '社区生活经验共创', summary: '和同好一起交换可复用的生活方法。' },
      { id: 'd3', title: '温柔整理工作坊', summary: '用不施压的方式帮助别人重建空间秩序。' },
    ],
    people: [
      { id: 'p1', name: '周然', city: '上海', bio: '在做社区花园，也喜欢记录普通人的生活经验。', publicInterests: ['社区花园', '摄影', '共创'] },
      { id: 'p2', name: '苏禾', city: '杭州', bio: '自由编辑，正在整理适合新手的植物照护手册。', publicInterests: ['植物', '编辑', '手作'] },
    ],
    schedule: { enabled: true, localTime: '21:30', timezone: 'Asia/Shanghai' },
  };

  const load = () => {
    try { return { ...structuredClone(seed), ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
    catch { return structuredClone(seed); }
  };
  const db = load();
  for (const key of ['conversations', 'cards', 'abilities', 'directions', 'people']) {
    if (!Array.isArray(db[key]) || db[key].length === 0) db[key] = structuredClone(seed[key]);
  }
  if (!db.messages || Object.keys(db.messages).length === 0) db.messages = structuredClone(seed.messages);
  if (!db.schedule) db.schedule = structuredClone(seed.schedule);
  const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(db));
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  const bodyOf = async (input) => { try { return JSON.parse(input || '{}'); } catch { return {}; } };
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === 'string' ? input : input.url;
    const url = new URL(requestUrl, location.href);
    if (!url.pathname.startsWith('/api/v1/')) return originalFetch(input, init);
    const method = String(init.method || 'GET').toUpperCase();
    const payload = await bodyOf(init.body);
    const path = url.pathname;

    if (path === '/api/v1/auth/code/request' && method === 'POST') return json({ ok: true, message: '演示验证码已生成。', devCode: '202608' });
    if (['/api/v1/auth/login/password', '/api/v1/auth/login/code', '/api/v1/auth/register'].includes(path) && method === 'POST') {
      if (!payload.phone) return json({ message: '请输入手机号。' }, 400);
      if (path.endsWith('/code') && payload.code !== '202608') return json({ message: '演示验证码为 202608。' }, 401);
      if (path.endsWith('/password') && payload.password && payload.password !== 'Shiguang2026!') return json({ message: '测试密码不正确。' }, 401);
      db.profile.phone = payload.phone; save();
      return json({ token: 'demo-session', user: db.profile });
    }
    if (path === '/api/v1/auth/session') return json({ user: db.profile });
    if (path === '/api/v1/me' && method === 'GET') return json({ profile: db.profile });
    if (path === '/api/v1/me' && method === 'PATCH') { db.profile = { ...db.profile, ...payload }; save(); return json({ profile: db.profile }); }
    if (path === '/api/v1/me/onboarding' && method === 'POST') { db.profile = { ...db.profile, ...payload, onboardingComplete: true }; save(); return json({ profile: db.profile }); }
    if (path === '/api/v1/conversations' && method === 'GET') return json({ conversations: db.conversations });
    if (path === '/api/v1/conversations' && method === 'POST') {
      const conversation = { id: `conv-${Date.now()}`, title: '尚未命名的新对话', mood: payload.mood || '平静', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messageCount: 0 };
      db.conversations.unshift(conversation); db.messages[conversation.id] = []; save(); return json({ conversation }, 201);
    }
    const conversationMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)$/);
    if (conversationMatch && method === 'GET') {
      const conversation = db.conversations.find((item) => item.id === conversationMatch[1]);
      return conversation ? json({ conversation, messages: db.messages[conversation.id] || [] }) : json({ message: '对话不存在。' }, 404);
    }
    const messageMatch = path.match(/^\/api\/v1\/conversations\/([^/]+)\/messages$/);
    if (messageMatch && method === 'POST') {
      const id = messageMatch[1];
      db.messages[id] ||= [];
      db.messages[id].push({ role: 'user', content: payload.content });
      const answer = `我听见了。你提到“${String(payload.content || '').slice(0, 28)}”，这件事里既有你的认真，也有你正在形成的方法。愿意再说说，哪一个瞬间最打动你吗？`;
      db.messages[id].push({ role: 'assistant', content: answer }); save();
      return new Response(answer, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (path === '/api/v1/cards') return json({ cards: db.cards });
    if (path === '/api/v1/settings/card-schedule' && method === 'GET') return json({ schedule: db.schedule });
    if (path === '/api/v1/settings/card-schedule' && method === 'PUT') { db.schedule = { ...db.schedule, ...payload }; save(); return json({ schedule: db.schedule }); }
    if (path === '/api/v1/profile/signals') return json({ signals: db.abilities });
    if (path === '/api/v1/insights/refresh' && method === 'POST') return json({ abilities: db.abilities, directions: db.directions, report: monthlyReport(url.searchParams.get('month')) });
    if (path === '/api/v1/directions') return json({ directions: db.directions });
    if (path === '/api/v1/people/recommendations') return json({ people: db.people });
    if (path === '/api/v1/reports/monthly') return json({ report: monthlyReport(url.searchParams.get('month')) });
    return json({ message: `演示接口暂未实现：${method} ${path}` }, 404);
  };

  function monthlyReport(month) {
    const selected = month || new Date().toISOString().slice(0, 7);
    return { month: selected, title: '让日常经验慢慢长成方法', summary: '这个月，你在植物照护、空间整理和社区分享中持续行动。你越来越能看见自己的观察力，也开始把个人经验转化为别人可以使用的方法。', keywords: ['观察', '整理', '照护', '分享'] };
  }
})();
