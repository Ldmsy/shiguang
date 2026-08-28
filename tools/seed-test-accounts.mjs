import { randomBytes, scryptSync } from 'node:crypto';
import { CloudJsonStore, CloudUserStore, createCloudDatabase } from '../apps/api/store.mjs';

const database = createCloudDatabase(process.env.CLOUDBASE_ENV_ID, process.env.CLOUDBASE_APIKEY);
if (!database) throw new Error('请先配置 CLOUDBASE_ENV_ID 和 CLOUDBASE_APIKEY。');

const userStore = new CloudUserStore(database);
const appStore = new CloudJsonStore(database);
const password = process.env.TEST_ACCOUNT_PASSWORD || 'Shiguang2026!';
const accounts = [
  ['19900000001', '林溪', '上海', ['植物照护', '社区分享']],
  ['19900000002', '小满', '杭州', ['手作', '生活记录']],
  ['19900000003', '安禾', '苏州', ['收纳整理', '亲子陪伴']],
  ['19900000004', '南枝', '成都', ['烘焙', '社区活动']],
  ['19900000005', '知夏', '广州', ['阅读', '阳台种植']],
];

const users = await userStore.read();
for (const [phone] of accounts) {
  if (users.some(user => user.phone === phone)) continue;
  const salt = randomBytes(16).toString('hex');
  users.push({
    id: randomBytes(12).toString('hex'),
    phone,
    salt,
    passwordHash: scryptSync(password, salt, 64).toString('hex'),
    createdAt: new Date().toISOString(),
  });
}
await userStore.save(users);

const now = Date.now();
const month = new Date().toISOString().slice(0, 7);
await appStore.mutate(data => {
  accounts.forEach(([phone, name, city, interests], accountIndex) => {
    const user = users.find(item => item.phone === phone);
    if (!user) return;
    const userId = user.id;
    const removeOwned = key => { data[key] = data[key].filter(item => !(item.userId === userId && item.testFixture)); };
    for (const key of ['profiles', 'conversations', 'messages', 'cards', 'abilities', 'directions', 'reports']) removeOwned(key);

    data.profiles.push({
      userId, name, city, interests, birthday: '',
      bio: `体验账号 ${accountIndex + 1}，用于测试“时光”的完整成长记录流程。`,
      onboardingComplete: true, discoveryVisible: true, testFixture: true, updatedAt: now,
    });
    const conversationId = `test_talk_${accountIndex + 1}`;
    data.conversations.push({ id: conversationId, userId, title: '我最近完成的一件小事', mood: '平静', createdAt: now - 86400_000, updatedAt: now, testFixture: true });
    const event = [
      '你把阳台上的植物按光照需要重新摆放，并为每一盆写了养护标签。',
      '你把织毛衣时容易出错的针法记录下来，整理成了能再次使用的步骤。',
      '你重新规划了家里的收纳位置，让家人也能轻松找到和放回物品。',
      '你为社区活动准备点心，并按过敏信息分别包装和标注。',
      '你连续记录阳台种子的发芽情况，并比较了不同浇水频率。',
    ][accountIndex];
    data.messages.push(
      { id: `test_msg_${accountIndex + 1}_1`, userId, conversationId, role: 'user', content: event.replace(/^你/, '我'), createdAt: now - 86000_000, testFixture: true },
      { id: `test_msg_${accountIndex + 1}_2`, userId, conversationId, role: 'assistant', content: '我听见了。你不只是完成了一件事，也在形成自己的观察与整理方法。', createdAt: now - 85000_000, testFixture: true },
    );
    data.cards.push({ id: `test_card_${accountIndex + 1}`, userId, conversationId, title: '把日常经验变成自己的方法', mood: '平静', createdAt: now - 86400_000, testFixture: true });
    data.abilities.push({ id: `test_ability_${accountIndex + 1}`, userId, label: ['持续照护', '经验整理', '空间规划', '细节关怀', '观察记录'][accountIndex], category: '行动', confidence: 86, evidence: event, sourceMessageIds: [`test_msg_${accountIndex + 1}_1`], updatedAt: now, testFixture: true });
    data.directions.push({ id: `test_direction_${accountIndex + 1}`, userId, title: `${interests[0]} × 经验分享`, summary: `把你在${interests[0]}中的真实经验整理成别人也能使用的内容。`, updatedAt: now, testFixture: true });
    data.reports.push({ id: `test_report_${accountIndex + 1}`, userId, month, title: '你正在更清楚地看见自己的方法', summary: `这个月，你通过一件具体的小事展现了${data.abilities.at(-1).label}。这仍是需要继续积累证据的能力线索。`, keywords: [data.abilities.at(-1).label, '真实记录', '持续行动'], updatedAt: now, testFixture: true });
  });
});

console.log(JSON.stringify({ ok: true, accountCount: accounts.length, password }));
