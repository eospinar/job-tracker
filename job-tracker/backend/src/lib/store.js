/**
 * Persistencia en un archivo JSON local (data/applications.json).
 * Suficiente para uso personal. Para producción, reemplaza este módulo por
 * Supabase/Firebase/Postgres manteniendo la misma interfaz (list, findByUrl, create, update, remove).
 */
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const DATA_DIR = path.resolve(import.meta.dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'applications.json');

let cache = null;
let writeQueue = Promise.resolve();

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(DB_PATH, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    cache = [];
  }
  return cache;
}

// Escritura atómica (tmp + rename) y serializada para evitar archivos corruptos.
function persist() {
  writeQueue = writeQueue.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_PATH}.tmp`;
    await writeFile(tmp, JSON.stringify(cache, null, 2));
    await rename(tmp, DB_PATH);
  });
  return writeQueue;
}

const normalizeUrl = (u) => u?.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();

export async function list() {
  const items = await load();
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findByUrl(url) {
  if (!url) return null;
  const target = normalizeUrl(url);
  return (await load()).find((a) => normalizeUrl(a.url) === target) || null;
}

export async function create(data) {
  const items = await load();
  const now = new Date().toISOString();
  const record = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
  items.push(record);
  await persist();
  return record;
}

export async function update(id, patch) {
  const items = await load();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
  await persist();
  return items[idx];
}

export async function remove(id) {
  const items = await load();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  await persist();
  return true;
}
