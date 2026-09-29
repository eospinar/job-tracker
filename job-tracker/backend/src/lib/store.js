/**
 * Persistencia de las aplicaciones como un único documento JSON.
 *  - En Vercel (BLOB_READ_WRITE_TOKEN definido): blob privado en Vercel Blob.
 *  - En local: archivo data/applications.json.
 * Cada cambio lee el documento, lo modifica y lo escribe condicionado al ETag leído;
 * si otra petición escribió en medio, se reintenta (control de concurrencia optimista).
 */
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

const BLOB_PATH = 'job-tracker/applications.json';
const DATA_DIR = path.resolve(import.meta.dirname, '../../data');
const FILE_PATH = path.join(DATA_DIR, 'applications.json');

const blobDriver = {
  async read() {
    const res = await get(BLOB_PATH, { access: 'private', useCache: false });
    if (!res) return { items: [], version: null };
    return { items: JSON.parse(await new Response(res.stream).text()), version: res.blob.etag };
  },
  async write(items, version) {
    await put(BLOB_PATH, JSON.stringify(items), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      ...(version ? { ifMatch: version } : { allowOverwrite: false }),
    });
  },
};

const fileDriver = {
  async read() {
    try {
      return { items: JSON.parse(await readFile(FILE_PATH, 'utf8')), version: null };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      return { items: [], version: null };
    }
  },
  // Escritura atómica (tmp + rename) para no dejar el archivo corrupto.
  async write(items) {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${FILE_PATH}.tmp`;
    await writeFile(tmp, JSON.stringify(items, null, 2));
    await rename(tmp, FILE_PATH);
  },
};

const driver = process.env.BLOB_READ_WRITE_TOKEN ? blobDriver : fileDriver;

// Serializa los cambios dentro del mismo proceso; entre instancias lo resuelve el ETag.
let queue = Promise.resolve();

/** fn(items) modifica items y devuelve { result, changed }. */
function mutate(fn) {
  const run = async () => {
    for (let attempt = 1; ; attempt++) {
      const { items, version } = await driver.read();
      const { result, changed } = fn(items);
      if (!changed) return result;
      try {
        await driver.write(items, version);
        return result;
      } catch (err) {
        const conflict = err instanceof BlobPreconditionFailedError || /already exists/i.test(err.message);
        if (!conflict || attempt >= 5) throw err;
      }
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => {});
  return next;
}

const normalizeUrl = (u) => u?.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();

export async function list() {
  const { items } = await driver.read();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Crea la aplicación; si ya existe una con la misma URL devuelve { duplicate }. */
export function create(data) {
  return mutate((items) => {
    const target = normalizeUrl(data.url);
    const duplicate = target && items.find((a) => normalizeUrl(a.url) === target);
    if (duplicate) return { result: { duplicate }, changed: false };

    const now = new Date().toISOString();
    const record = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    items.push(record);
    return { result: { record }, changed: true };
  });
}

export function update(id, patch) {
  return mutate((items) => {
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) return { result: null, changed: false };
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    return { result: items[idx], changed: true };
  });
}

export function remove(id) {
  return mutate((items) => {
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) return { result: false, changed: false };
    items.splice(idx, 1);
    return { result: true, changed: true };
  });
}
