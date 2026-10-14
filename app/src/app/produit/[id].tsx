import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { fmt, historiqueStock, stockActuel } from '../../core/registre';
import type { MouvementStock, Produit, Unite } from '../../core/types';
import { aujourdhui, nouvelId, remplacer, useStore } from '../../data/store';
import { Badge, Bouton, Carte, Champ, ChampNombre, confirmer, Ecran, Ligne, lireNombre, ListeAlertes, Puce, SousTitre, Texte, versTexte } from '../../ui/kit';

export default function FicheProduit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier } = useStore();
  const existant = d.produits.find((p) => p.id === id);
  const nouveau = id === 'nouveau';

  const [nom, setNom] = useState(existant?.nom ?? '');
  const [amm, setAmm] = useState(existant?.amm ?? '');
  const [unite, setUnite] = useState<Unite>(existant?.unite ?? 'L');
  const [doseMax, setDoseMax] = useState(versTexte(existant?.doseMaxHa));
  const [dar, setDar] = useState(versTexte(existant?.darJours));
  const [znt, setZnt] = useState(versTexte(existant?.zntM));
  const [dre, setDre] = useState(versTexte(existant?.dreHeures));
  const [seuil, setSeuil] = useState(versTexte(existant?.seuilAlerte));
  const [stockInitial, setStockInitial] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  if (!existant && !nouveau) return <Ecran><Texte>Produit introuvable.</Texte></Ecran>;

  const enregistrer = () => {
    if (!nom.trim()) return setErreur('Donnez le nom commercial du produit.');
    const p: Produit = {
      ...(existant ?? {}),
      id: existant?.id ?? nouvelId(),
      nom: nom.trim(),
      amm: amm.trim() || undefined,
      unite,
      doseMaxHa: lireNombre(doseMax),
      darJours: lireNombre(dar),
      zntM: lireNombre(znt),
      dreHeures: lireNombre(dre),
      seuilAlerte: lireNombre(seuil),
    };
    const initial = nouveau ? lireNombre(stockInitial) : undefined;
    modifier((x) => ({
      ...x,
      produits: remplacer(x.produits, p),
      mouvements: initial
        ? [...x.mouvements, { id: nouvelId(), produitId: p.id, date: aujourdhui(), type: 'ajustement', quantite: initial, note: 'Stock de départ' }]
        : x.mouvements,
    }));
    if (nouveau) router.replace(`/produit/${p.id}`);
    else router.back();
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: nouveau ? 'Nouveau produit' : existant!.nom }} />
      {existant && <Stock produit={existant} />}

      <SousTitre>Fiche produit</SousTitre>
      <Champ label="Nom commercial" value={nom} onChangeText={setNom} placeholder="Bouillie bordelaise RSR" />
      <Champ label="N° AMM" value={amm} onChangeText={setAmm} keyboardType="number-pad" placeholder="2000123" aide="Obligatoire dans le registre. Sur l'étiquette ou sur ephy.anses.fr." />
      <Texte doux>Unité</Texte>
      <Ligne>
        <Puce titre="Litres (L)" actif={unite === 'L'} onPress={() => setUnite('L')} />
        <Puce titre="Kilos (kg)" actif={unite === 'kg'} onPress={() => setUnite('kg')} />
      </Ligne>
      <ChampNombre label={`Dose maximale homologuée vigne (${unite}/ha)`} valeur={doseMax} onChange={setDoseMax} aide="L'app vous alerte si un traitement la dépasse." />
      <Ligne>
        <View style={{ flex: 1 }}>
          <ChampNombre label="DAR (jours)" valeur={dar} onChange={setDar} aide="Délai avant récolte" />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre label="DRE (heures)" valeur={dre} onChange={setDre} aide="Délai de rentrée" />
        </View>
      </Ligne>
      <Ligne>
        <View style={{ flex: 1 }}>
          <ChampNombre label="ZNT (m)" valeur={znt} onChange={setZnt} aide="Zone non traitée" />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre label={`Alerte stock (${unite})`} valeur={seuil} onChange={setSeuil} aide="En dessous, alerte" />
        </View>
      </Ligne>
      {nouveau && <ChampNombre label={`Stock actuel (${unite})`} valeur={stockInitial} onChange={setStockInitial} aide="Ce que vous avez déjà au local." />}

      {erreur && <ListeAlertes alertes={[{ niveau: 'danger', message: erreur }]} />}
      <Bouton titre="Enregistrer" onPress={enregistrer} />

      {existant && (
        <Bouton
          titre={existant.archive ? 'Désarchiver' : 'Archiver (plus utilisé)'}
          variante="secondaire"
          onPress={() => {
            modifier((x) => ({ ...x, produits: remplacer(x.produits, { ...existant, archive: !existant.archive }) }));
            router.back();
          }}
        />
      )}
    </Ecran>
  );
}

function Stock({ produit }: { produit: Produit }) {
  const { donnees: d, modifier } = useStore();
  const [type, setType] = useState<MouvementStock['type'] | null>(null);
  const [quantite, setQuantite] = useState('');
  const [date, setDate] = useState(aujourdhui());
  const [fournisseur, setFournisseur] = useState('');
  const [lot, setLot] = useState('');
  const [note, setNote] = useState('');

  const stock = stockActuel(d, produit.id);
  const historique = historiqueStock(d, produit.id).reverse();

  const ajouter = () => {
    const q = lireNombre(quantite);
    if (q === undefined || !type || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (type === 'achat' && q <= 0) return;
    const m: MouvementStock = {
      id: nouvelId(),
      produitId: produit.id,
      date,
      type,
      // Une correction donne le stock compté : on enregistre l'écart.
      quantite: type === 'achat' ? q : q - stock,
      fournisseur: fournisseur.trim() || undefined,
      lot: lot.trim() || undefined,
      note: type === 'ajustement' ? note.trim() || 'Inventaire' : undefined,
    };
    modifier((x) => ({ ...x, mouvements: [...x.mouvements, m] }));
    setType(null);
    setQuantite('');
    setFournisseur('');
    setLot('');
    setNote('');
  };

  const supprimerMouvement = async (mid: string) => {
    if (await confirmer('Supprimer cette ligne de stock ?', '', 'Supprimer'))
      modifier((x) => ({ ...x, mouvements: x.mouvements.filter((m) => m.id !== mid) }));
  };

  return (
    <>
      <Carte>
        <Ligne>
          <View style={{ flex: 1 }}>
            <Texte doux>En stock</Texte>
            <Texte gras>
              {fmt(stock)} {produit.unite}
            </Texte>
          </View>
          {stock < 0 && <Badge texte="Négatif : achat manquant ?" ton="danger" />}
        </Ligne>
      </Carte>

      {type === null ? (
        <Ligne>
          <View style={{ flex: 1 }}>
            <Bouton titre="＋ Achat" onPress={() => setType('achat')} />
          </View>
          <View style={{ flex: 1 }}>
            <Bouton titre="Inventaire" variante="secondaire" onPress={() => setType('ajustement')} />
          </View>
        </Ligne>
      ) : (
        <Carte>
          <SousTitre>{type === 'achat' ? 'Nouvel achat' : 'Inventaire : stock compté'}</SousTitre>
          <ChampNombre label={type === 'achat' ? `Quantité achetée (${produit.unite})` : `Quantité réellement en stock (${produit.unite})`} valeur={quantite} onChange={setQuantite} />
          <Champ label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} />
          {type === 'achat' ? (
            <>
              <Champ label="Fournisseur" value={fournisseur} onChangeText={setFournisseur} />
              <Champ label="N° de lot" value={lot} onChangeText={setLot} />
            </>
          ) : (
            <Champ label="Note" value={note} onChangeText={setNote} placeholder="Inventaire de fin de campagne" />
          )}
          <Ligne>
            <View style={{ flex: 1 }}>
              <Bouton titre="Annuler" variante="secondaire" onPress={() => setType(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton titre="Ajouter" onPress={ajouter} desactive={lireNombre(quantite) === undefined} />
            </View>
          </Ligne>
        </Carte>
      )}

      {historique.length > 0 && <SousTitre>Mouvements</SousTitre>}
      {historique.map((l, i) => (
        <Carte
          key={i}
          onPress={l.traitementId ? () => router.push(`/traitement/${l.traitementId}`) : l.mouvementId ? () => supprimerMouvement(l.mouvementId!) : undefined}
        >
          <Ligne>
            <View style={{ flex: 1 }}>
              <Texte>{l.libelle}</Texte>
              <Texte doux>{l.date}</Texte>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Texte gras>
                {l.quantite > 0 ? '+' : ''}
                {fmt(l.quantite)} {produit.unite}
              </Texte>
              <Texte doux>
                solde {fmt(l.solde)}
              </Texte>
            </View>
          </Ligne>
        </Carte>
      ))}
    </>
  );
}
