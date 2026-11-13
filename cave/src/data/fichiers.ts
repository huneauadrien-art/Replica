// Lire un fichier choisi et partager un export, sur téléphone comme sur le web.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** Ouvre le sélecteur de fichiers et renvoie le contenu, ou null si annulé. */
export async function choisirFichier(types: string[] = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', '*/*']): Promise<{ nom: string; octets: Uint8Array } | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: types,
    copyToCacheDirectory: true,
    base64: false,
  });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0];
  const tampon = a.file ? await a.file.arrayBuffer() : await new File(a.uri).arrayBuffer();
  return { nom: a.name, octets: new Uint8Array(tampon) };
}

export async function partagerTexte(nom: string, contenu: string, type: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const f = new File(Paths.cache, nom);
  if (f.exists) f.delete();
  f.create();
  f.write(contenu);
  await Sharing.shareAsync(f.uri, { mimeType: type, dialogTitle: nom });
}

/** Sur téléphone : crée un PDF et ouvre le partage. Sur le web : ouvre l'impression. */
/** Type de fichier d'après son nom. */
export function typeDepuisNom(nom: string): string {
  const ext = nom.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'xml' ? 'application/xml' : 'application/octet-stream';
}

/** Prend une photo (ou en choisit une dans la galerie) et renvoie ses octets en JPEG. */
export async function photographier(source: 'camera' | 'galerie'): Promise<{ nom: string; octets: Uint8Array } | null> {
  const ImagePicker = await import('expo-image-picker');
  if (source === 'camera' && Platform.OS !== 'web') {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) throw new Error("L'app n'a pas accès à l'appareil photo (réglages du téléphone).");
  }
  const options = { mediaTypes: ['images' as const], quality: 0.6 };
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0];
  const tampon = a.file ? await a.file.arrayBuffer() : Platform.OS === 'web' ? await (await fetch(a.uri)).arrayBuffer() : await new File(a.uri).arrayBuffer();
  return { nom: a.fileName ?? 'photo.jpg', octets: new Uint8Array(tampon) };
}

/** Ouvre une pièce jointe : nouvel onglet sur le web, aperçu / partage sur téléphone. */
export async function ouvrirFichier(nom: string, octets: Uint8Array, type: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([octets as BlobPart], { type }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.target = '_blank';
    lien.rel = 'noopener';
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const f = new File(Paths.cache, nom);
  if (f.exists) f.delete();
  f.create();
  f.write(octets);
  await Sharing.shareAsync(f.uri, { mimeType: type, dialogTitle: nom });
}

/** Partage un fichier binaire (le zip de l'export comptable). */
export async function partagerFichier(nom: string, octets: Uint8Array, type: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([octets as BlobPart], { type }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const f = new File(Paths.cache, nom);
  if (f.exists) f.delete();
  f.create();
  f.write(octets);
  await Sharing.shareAsync(f.uri, { mimeType: type, dialogTitle: nom });
}
