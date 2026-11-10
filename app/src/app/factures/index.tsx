import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ecartTotal, euros, facturePreparee, lignesEnStock } from '../../core/factures';
import { ErreurFacture, lireFactureElectronique } from '../../core/facturx';
import type { FactureAchat } from '../../core/types';
import { brouillons } from '../../data/brouillons';
import { choisirFichier, photographier, typeDepuisNom } from '../../data/fichiers';
import { aujourdhui, nouvelId, useStore } from '../../data/store';
import { Badge, Bouton, Carte, Ecran, Ligne, ListeAlertes, Puce, SousTitre, Texte, Vide } from '../../ui/kit';

export default function Factures() {
  const { donnees: d, ajouterPiece } = useStore();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [erreur, setErreur] = useState<string | null>(null);
  const [lecture, setLecture] = useState(false);

  const vierge = (id: string): FactureAchat => ({
    id,
    type: 'facture',
    fournisseur: '',
    numero: '',
    date: aujourdhui(),
    lignes: [],
    source: 'saisie',
  });

  const ouvrirBrouillon = (f: FactureAchat, message?: string) => {
    brouillons.set(f.id, { facture: f, message });
    router.push(`/factures/${f.id}`);
  };

  const importer = async () => {
    setErreur(null);
    try {
      const fichier = await choisirFichier(['application/pdf', 'application/xml', 'text/xml', '*/*']);
      if (!fichier) return;
      setLecture(true);
      const id = nouvelId();
      const ext = /\.xml$/i.test(fichier.nom) ? 'xml' : 'pdf';
      const piece = { id: `${id}.${ext}`, nom: fichier.nom, type: typeDepuisNom(fichier.nom), taille: fichier.octets.length };
      let f: FactureAchat;
      let message: string | undefined;
      try {
        f = { ...facturePreparee(lireFactureElectronique(fichier.octets), d.produits, id, d.factures), piece };
      } catch (e) {
        if (!(e instanceof ErreurFacture)) throw e;
        f = { ...vierge(id), piece };
        message = e.message;
      }
      await ajouterPiece(piece.id, fichier.octets);
      ouvrirBrouillon(f, message);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setLecture(false);
    }
  };

  const photo = async (source: 'camera' | 'galerie') => {
    setErreur(null);
    try {
      const p = await photographier(source);
      if (!p) return;
      const id = nouvelId();
      const piece = { id: `${id}.jpg`, nom: p.nom, type: 'image/jpeg', taille: p.octets.length };
      await ajouterPiece(piece.id, p.octets);
      ouvrirBrouillon({ ...vierge(id), piece }, 'Photo jointe : saisissez le fournisseur, le numéro et les lignes de produits.');
    } catch (e) {
      setErreur((e as Error).message);
    }
  };

  const annees = [...new Set([new Date().getFullYear(), ...d.factures.map((f) => Number(f.date.slice(0, 4)))])].filter((a) => a > 1900).sort((a, b) => b - a);
  const liste = d.factures.filter((f) => f.date.startsWith(String(annee))).sort((a, b) => b.date.localeCompare(a.date) || b.numero.localeCompare(a.numero));
  const signe = (f: FactureAchat) => (f.type === 'avoir' ? -1 : 1);
  const totalHT = liste.reduce((s, f) => s + signe(f) * (f.totalHT ?? f.lignes.reduce((t, l) => t + l.montantHT, 0)), 0);

  // Regroupement par mois.
  const mois = new Map<string, FactureAchat[]>();
  for (const f of liste) mois.set(f.date.slice(0, 7), [...(mois.get(f.date.slice(0, 7)) ?? []), f]);
  const nomMois = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <Ecran>
      <Bouton titre="Ajouter une facture reçue (PDF)" onPress={importer} />
      <Ligne>
        <View style={{ flex: 1 }}>
          <Bouton titre="Photographier" variante="secondaire" onPress={() => photo('camera')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Saisir à la main" variante="secondaire" onPress={() => ouvrirBrouillon(vierge(nouvelId()))} />
        </View>
      </Ligne>
      {lecture && <ActivityIndicator />}
      {erreur && <ListeAlertes alertes={[{ niveau: 'danger', message: erreur }]} />}

      <Ligne>
        <View style={{ flex: 1 }}>
          <Bouton titre="Coûts par parcelle" variante="secondaire" onPress={() => router.push('/factures/couts')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Export comptable" variante="secondaire" onPress={() => router.push('/factures/export')} />
        </View>
      </Ligne>

      <Ligne>
        {annees.map((a) => (
          <Puce key={a} titre={String(a)} actif={a === annee} onPress={() => setAnnee(a)} />
        ))}
      </Ligne>

      {liste.length === 0 ? (
        <Vide
          titre={`Aucune facture en ${annee}`}
          texte="Ajoutez le PDF reçu de votre coopérative : s'il est au format Factur-X, les lignes et les prix se remplissent seuls, et le stock se met à jour."
        />
      ) : (
        <Texte doux>
          {liste.length} facture(s) · {euros(totalHT)} HT
        </Texte>
      )}

      {[...mois.entries()].map(([m, fs]) => (
        <View key={m} style={{ gap: 8 }}>
          <SousTitre>{nomMois(m)}</SousTitre>
          {fs.map((f) => {
            const aRelier = f.lignes.length > 0 && lignesEnStock(f).length === 0;
            return (
              <Carte key={f.id} onPress={() => router.push(`/factures/${f.id}`)}>
                <Ligne>
                  <View style={{ flex: 1 }}>
                    <Texte gras>{f.fournisseur || 'Fournisseur ?'}</Texte>
                    <Texte doux>
                      {f.date} · n° {f.numero || '?'} · {f.lignes.length} ligne(s)
                    </Texte>
                  </View>
                  <Texte gras>{euros(f.totalTTC)}</Texte>
                </Ligne>
                <Ligne>
                  {f.type === 'avoir' && <Badge texte="Avoir" />}
                  {f.source === 'facturx' && <Badge texte="Factur-X" ton="ok" />}
                  {f.source === 'pdf' && <Badge texte="PDF lu" ton="ok" />}
                  {!f.piece && <Badge texte="Sans pièce" ton="attention" />}
                  {aRelier && <Badge texte="Produits à relier" ton="attention" />}
                  {ecartTotal(f) !== 0 && f.lignes.length > 0 && <Badge texte="Total à vérifier" ton="attention" />}
                </Ligne>
              </Carte>
            );
          })}
        </View>
      ))}
    </Ecran>
  );
}
