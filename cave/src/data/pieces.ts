// Pièces jointes gardées sur le téléphone (dossier de l'app), en attendant le NAS et comme copie locale.

import { Directory, File, Paths } from 'expo-file-system';

const dossier = () => {
  const d = new Directory(Paths.document, 'pieces');
  if (!d.exists) d.create();
  return d;
};

export async function garderLocal(id: string, octets: Uint8Array): Promise<void> {
  const f = new File(dossier(), id);
  if (f.exists) f.delete();
  f.create();
  f.write(octets);
}

export async function lireLocal(id: string): Promise<Uint8Array | null> {
  const f = new File(dossier(), id);
  if (!f.exists) return null;
  return new Uint8Array(await f.arrayBuffer());
}
