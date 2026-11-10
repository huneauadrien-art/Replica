// Version web : les pièces jointes vont dans la base IndexedDB du navigateur (localStorage est trop petit).

const BASE = 'registre-vigne-pieces';
const TABLE = 'pieces';

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((ok, erreur) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(TABLE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erreur(r.error);
  });
}

async function operation<T>(mode: IDBTransactionMode, f: (t: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir();
  return new Promise((ok, erreur) => {
    const r = f(db.transaction(TABLE, mode).objectStore(TABLE));
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erreur(r.error);
  });
}

export async function garderLocal(id: string, octets: Uint8Array): Promise<void> {
  await operation('readwrite', (t) => t.put(octets, id));
}

export async function lireLocal(id: string): Promise<Uint8Array | null> {
  try {
    const v = await operation<Uint8Array | undefined>('readonly', (t) => t.get(id));
    return v ? new Uint8Array(v) : null;
  } catch {
    return null;
  }
}
