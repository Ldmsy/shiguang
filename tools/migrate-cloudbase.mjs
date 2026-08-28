import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CloudUserStore, createCloudDatabase } from '../apps/api/store.mjs';

const db = createCloudDatabase(process.env.CLOUDBASE_ENV_ID, process.env.CLOUDBASE_APIKEY);
if (!db) throw new Error('请先在 .env 配置 CLOUDBASE_ENV_ID 和 CLOUDBASE_APIKEY。');

const dataDir = resolve(process.env.DATA_DIR || '.data');
const usersFile = resolve(dataDir, 'users.json');
const appFile = resolve(dataDir, 'app.json');
const users = existsSync(usersFile) ? JSON.parse(await readFile(usersFile, 'utf8')) : [];
const appData = existsSync(appFile) ? JSON.parse(await readFile(appFile, 'utf8')) : {};

await new CloudUserStore(db).save(users);
const { error } = await db.from('shiguang_state').upsert(
  { id: 'main', data: appData, updated_at: new Date().toISOString() },
  { onConflict: 'id' },
);
if (error) throw error;

console.log(JSON.stringify({ migratedUsers: users.length, migratedCollections: Object.keys(appData).length }));
