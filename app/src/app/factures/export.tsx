import { strToU8, zipSync } from 'fflate';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { euros, exportComptableCsv, facturesDeLaPeriode, nomPiece } from '../../core/factures';
import { partagerFichier, partagerTexte } from '../../data/fichiers';
import { useStore } from '../../data/store';
import { Bouton, Carte, Ecran, Ligne, ListeAlertes, Puce, Texte } from '../../ui/kit';

type Periode = { titre: string; du: string; au: string };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function periodes(): Periode[] {
  const t = new Date();
  const a = t.getFullYear();
  const m = t.getMonth();
  const q = Math.floor(m / 3);
  const trimestre = (annee: number, k: number): Periode => ({
    titre: `T${k + 1} ${annee}`,
    du: iso(new Date(annee, k * 3, 1)),
    au: iso(new Date(annee, k * 3 + 3, 0)),
  });
  const moisDe = (annee: number, k: number): Periode => ({
    titre: new Date(annee, k, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    du: iso(new Date(annee, k, 1)),
    au: iso(new Date(annee, k + 1, 0)),
  });
  return [
    moisDe(a, m),
    moisDe(m === 0 ? a - 1 : a, (m + 11) % 12),
    trimestre(a, q),
    q === 0 ? trimestre(a - 1, 3) : trimestre(a, q - 1),
    { titre: `Année ${a}`, du: `${a}-01-01`, au: `${a}-12-31` },
    { titre: `Année ${a - 1}`, du: `${a - 1}-01-01`, au: `${a - 1}-12-31` },
  ];
}

export default function ExportComptable() {
  const { donnees: d, lirePiece } = useStore();
  const liste = periodes();
  const [periode, setPeriode] = useState(liste[3]);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<{ niveau: 'danger' | 'attention'; texte: string } | null>(null);

  const factures = facturesDeLaPeriode(d, periode.du, periode.au);
  const total = (k: 'totalHT' | 'totalTVA' | 'totalTTC') => factures.reduce((s, f) => s + (f.type === 'avoir' ? -1 : 1) * (f[k] ?? 0), 0);
  const nomBase = `factures-achat_${periode.du}_${periode.au}`;

  const csv = () => partagerTexte(`${nomBase}.csv`, exportComptableCsv(factures), 'text/csv').catch((e) => setMessage({ niveau: 'danger', texte: (e as Error).message }));

  const zip = async () => {
    setMessage(null);
    setEnCours(true);
    try {
      const fichiers: Record<string, Uint8Array> = { [`${nomBase}.csv`]: strToU8(exportComptableCsv(factures)) };
      const manquantes: string[] = [];
      for (const f of factures) {
        if (!f.piece) continue;
        try {
          fichiers[`pieces/${nomPiece(f)}`] = await lirePiece(f.piece.id);
        } catch {
          manquantes.push(`${f.fournisseur} n° ${f.numero}`);
        }
      }
      await partagerFichier(`${nomBase}.zip`, zipSync(fichiers), 'application/zip');
      if (manquantes.length)
        setMessage({ niveau: 'attention', texte: `Pièces introuvables (ni sur ce téléphone ni sur le NAS) : ${manquantes.join(', ')}.` });
    } catch (e) {
      setMessage({ niveau: 'danger', texte: (e as Error).message });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Ecran>
      <Texte doux>Pour votre expert-comptable : le tableau des factures d'achat de la période et, dans le zip, chaque pièce nommée par date, fournisseur et numéro.</Texte>
      <Ligne>
        {liste.map((p) => (
          <Puce key={p.titre} titre={p.titre} actif={p.titre === periode.titre} onPress={() => setPeriode(p)} />
        ))}
      </Ligne>
      <Carte>
        <Texte gras>
          {factures.length} facture(s) du {periode.du} au {periode.au}
        </Texte>
        <Texte doux>
          {euros(total('totalHT'))} HT · {euros(total('totalTVA'))} TVA · {euros(total('totalTTC'))} TTC
        </Texte>
        <Texte doux>{factures.filter((f) => !f.piece).length} sans pièce jointe</Texte>
      </Carte>
      {message && <ListeAlertes alertes={[{ niveau: message.niveau, message: message.texte }]} />}
      <Ligne>
        <View style={{ flex: 1 }}>
          <Bouton titre="Zip (tableau + pièces)" onPress={zip} desactive={factures.length === 0 || enCours} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Tableau seul (CSV)" variante="secondaire" onPress={csv} desactive={factures.length === 0} />
        </View>
      </Ligne>
      {enCours && <ActivityIndicator />}
    </Ecran>
  );
}
