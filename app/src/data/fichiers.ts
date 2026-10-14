// Lire un fichier choisi et partager un export, sur téléphone comme sur le web.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** Ouvre le sélecteur de fichiers et renvoie le contenu, ou null si annulé. */
export async function choisirFichier(): Promise<{ nom: string; octets: Uint8Array } | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', '*/*'],
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
export async function partagerPdf(html: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
