import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import cloudbase from '@cloudbase/js-sdk';

const empty = () => ({
  users: [], profiles: [], conversations: [], messages: [], cardDrafts: [], cards: [],
  abilities: [], reports: [], memories: [], settings: [], directions: [],
  connectionRequests: [], partnerConversations: [], partnerMessages: [], consents: [], exports: [],
});

export class JsonStore {
  constructor(file) { this.file = file; this.queue = Promise.resolve(); }
  async read() {
    if (!existsSync(this.file)) return empty();
    const value = { ...empty(), ...JSON.parse(await readFile(this.file, 'utf8')) };
    for (const key of Object.keys(empty())) value[key] ||= [];
    return value;
  }
  async mutate(change) {
    const run = this.queue.then(async () => {
      const data = await this.read();
      const result = await change(data);
      await mkdir(dirname(this.file), { recursive: true });
      const temporary = `${this.file}.tmp`;
      await writeFile(temporary, JSON.stringify(data, null, 2));
      await rename(temporary, this.file);
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}

export function createCloudDatabase(env, accessKey) {
  if (!env || !accessKey) return null;
  const app = cloudbase.init({ env, region: 'ap-shanghai', accessKey });
  return typeof app.rdb === 'function' ? app.rdb() : app.rdb;
}

export class CloudJsonStore {
  constructor(db) { this.db = db; this.queue = Promise.resolve(); }
  async read() {
    const { data, error } = await this.db.from('shiguang_state').select('data').eq('id', 'main');
    if (error) throw new Error(`CLOUDBASE_READ_FAILED: ${error.message || error}`);
    const value = { ...empty(), ...(data?.[0]?.data || {}) };
    for (const key of Object.keys(empty())) value[key] ||= [];
    return value;
  }
  async mutate(change) {
    const run = this.queue.then(async () => {
      const data = await this.read();
      const result = await change(data);
      const response = await this.db.from('shiguang_state').upsert(
        { id: 'main', data, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );
      if (response.error) throw new Error(`CLOUDBASE_WRITE_FAILED: ${response.error.message || response.error}`);
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}

export class CloudUserStore {
  constructor(db) { this.db = db; }
  async read() {
    const { data, error } = await this.db.from('shiguang_users').select('*');
    if (error) throw new Error(`CLOUDBASE_USERS_READ_FAILED: ${error.message || error}`);
    return (data || []).map(row => ({ id: row.id, phone: row.phone, salt: row.salt, passwordHash: row.password_hash, createdAt: row.created_at }));
  }
  async save(users) {
    if (!users.length) return;
    const rows = users.map(user => ({ id: user.id, phone: user.phone, salt: user.salt, password_hash: user.passwordHash, created_at: user.createdAt }));
    const { error } = await this.db.from('shiguang_users').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`CLOUDBASE_USERS_WRITE_FAILED: ${error.message || error}`);
  }
}
