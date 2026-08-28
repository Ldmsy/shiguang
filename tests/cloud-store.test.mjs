import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudJsonStore, CloudUserStore } from '../apps/api/store.mjs';

function fakeDatabase(seed = {}) {
  const tables = structuredClone(seed);
  return {
    tables,
    from(name) {
      tables[name] ||= [];
      return {
        select() {
          return {
            eq: async (field, value) => ({ data: tables[name].filter(row => row[field] === value), error: null }),
            then(resolve) { return resolve({ data: tables[name], error: null }); },
          };
        },
        async upsert(value) {
          const rows = Array.isArray(value) ? value : [value];
          for (const row of rows) {
            const index = tables[name].findIndex(item => item.id === row.id);
            if (index >= 0) tables[name][index] = { ...tables[name][index], ...row };
            else tables[name].push(row);
          }
          return { error: null };
        },
      };
    },
  };
}

test('CloudJsonStore 读写统一的云端状态记录', async () => {
  const db = fakeDatabase({ shiguang_state: [{ id: 'main', data: { conversations: [] } }] });
  const store = new CloudJsonStore(db);
  await store.mutate(data => data.conversations.push({ id: 'talk-1' }));
  const data = await store.read();
  assert.equal(data.conversations[0].id, 'talk-1');
  assert.ok(Array.isArray(data.cards));
});

test('CloudUserStore 映射密码哈希字段且不保存明文密码', async () => {
  const db = fakeDatabase();
  const store = new CloudUserStore(db);
  await store.save([{ id: 'user-1', phone: '13800000000', salt: 'salt', passwordHash: 'hash', createdAt: '2026-08-28' }]);
  const users = await store.read();
  assert.equal(users[0].passwordHash, 'hash');
  assert.equal(db.tables.shiguang_users[0].password_hash, 'hash');
  assert.equal('password' in db.tables.shiguang_users[0], false);
});
