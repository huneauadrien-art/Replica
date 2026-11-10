import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { contenanceDepuisLibelle, doublon, ecartTotal, enregistrerFacture, euros, facteurConversion, nomUnite, normaliser, supprimerFacture } from '../../core/factures';
import { fmt } from '../../core/registre';
import type { FactureAchat, LigneFacture, Produit, Unite } from '../../core/types';
import { brouillons } from '../../data/brouillons';
import { ouvrirFichier } from '../../data/fichiers';
import { nouvelId, useStore } from '../../data/store';
import { Badge, Bouton, Carte, Champ, ChampNombre, confirmer, couleurs, Ecran, Ligne, lireNombre, ListeAlertes, Puce, SousTitre, Texte, versTexte } from '../../ui/kit';
import { versBase64 } from '../../core/base64';

export default function FicheFacture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier, lirePiece, envoyerPiece } = useStore();
  const existante = d.factures.find((f) => f.id === id);
  const brouillon = brouillons.get(id);
  const [f, setF] = useState<FactureAchat | undefined>(existante ?? brouillon?.facture);
  // Textes des champs numériques d'en-tête, pour accepter la virgule pendant la frappe.
  const [totaux, setTotaux] = useState({ ht: versTexte(f?.totalHT), tva: versTexte(f?.totalTVA), ttc: versTexte(f?.totalTTC) });
  const [choix, setChoix] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [tenter, setTenter] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);
  const [ouverture, setOuverture] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const produitsActifs = useMemo(() => d.produits.filter((p) => !p.archive).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [d.produits]);

  if (!f) return <Ecran><Texte>Facture introuvable.</Texte></Ecran>;

  const maj = (champs: Partial<FactureAchat>) => setF({ ...f, ...champs });
  const majLigne = (i: number, l: Partial<LigneFacture>) => setF({ ...f, lignes: f.lignes.map((x, k) => (k === i ? { ...x, ...l } : x)) });

  const relier = (i: number, p: Produit | undefined) => {
    const l = f.lignes[i];
    const facteur = p ? facteurConversion(l, p) : undefined;
    majLigne(i, { produitId: p?.id, quantiteStock: p && facteur != null ? Math.round(l.quantite * facteur * 1000) / 1000 : undefined });
    setChoix(null);
    setVersion((v) => v + 1);
  };

  const creerProduit = (i: number) => {
    const l = f.lignes[i];
    const unite: Unite = l.unite === 'LTR' || l.unite === 'HLT' || l.unite === 'MLT' || contenanceDepuisLibelle(l.libelle, 'L') != null ? 'L' : 'kg';
    // Nom lisible : sans la contenance ni le conditionnement.
    const nom = l.libelle
      .replace(/\b(BIDON|SAC|FUT|FÛT|CARTON|BOITE|BOÎTE|FLACON|BIG ?BAG)\b.*$/i, '')
      .replace(/\d+(?:[.,]\d+)?\s*(KG|L|LT|G|ML|CL)\b.*$/i, '')
      .trim()
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());
    const produit: Produit = { id: nouvelId(), nom: nom || l.libelle, unite };
    modifier((x) => ({ ...x, produits: [...x.produits, produit] }));
    relier(i, produit);
  };

  const ajouterLigne = () => {
    setF({ ...f, lignes: [...f.lignes, { libelle: '', quantite: 1, montantHT: 0 }] });
    setVersion((v) => v + 1);
  };
  const retirerLigne = (i: number) => {
    setF({ ...f, lignes: f.lignes.filter((_, k) => k !== i) });
    setVersion((v) => v + 1);
  };

  const voirPiece = async () => {
    if (!f.piece) return;
    setErreur(null);
    setOuverture(true);
    try {
      const octets = await lirePiece(f.piece.id);
      if (f.piece.type.startsWith('image/')) setApercu(`data:${f.piece.type};base64,${versBase64(octets)}`);
      else await ouvrirFichier(f.piece.nom, octets, f.piece.type);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOuverture(false);
    }
  };

  const facture: FactureAchat = {
    ...f,
    fournisseur: f.fournisseur.trim(),
    numero: f.numero.trim(),
    totalHT: lireNombre(totaux.ht),
    totalTVA: lireNombre(totaux.tva),
    totalTTC: lireNombre(totaux.ttc),
  };
  const manques = [
    !facture.fournisseur && 'Indiquez le fournisseur.',
    !facture.numero && 'Indiquez le numéro de la facture.',
    !/^\d{4}-\d{2}-\d{2}$/.test(facture.date) && 'Date invalide (AAAA-MM-JJ).',
  ].filter(Boolean) as string[];
  const double = facture.numero ? doublon(d, facture) : undefined;
  const ecart = ecartTotal(facture);
  const nonReliees = facture.lignes.filter((l) => !l.produitId).length;
  const sansQuantite = facture.lignes.filter((l) => l.produitId && !(l.quantiteStock && l.quantiteStock > 0)).length;

  const enregistrer = async () => {
    setTenter(true);
    if (manques.length) return;
    if (double && !(await confirmer('Facture déjà enregistrée ?', `${double.fournisseur} n° ${double.numero} du ${double.date} existe déjà.`, 'Enregistrer quand même'))) return;
    modifier((x) => enregistrerFacture(x, facture));
    // La pièce ne part au NAS qu'une fois la facture enregistrée.
    if (facture.piece && !existante) envoyerPiece(facture.piece.id);
    brouillons.delete(f.id);
    router.back();
  };

  const supprimer = async () => {
    if (!existante) {
      brouillons.delete(f.id);
      router.back();
      return;
    }
    if (await confirmer('Supprimer cette facture ?', 'Les entrées de stock qu’elle a créées seront retirées.', 'Supprimer')) {
      modifier((x) => supprimerFacture(x, f.id));
      router.back();
    }
  };

  return (
    <Ecran>
      <Stack.Screen options={{ title: existante ? `${f.fournisseur || 'Facture'} n° ${f.numero}` : 'Nouvelle facture' }} />

      {brouillon?.message && !existante && <ListeAlertes alertes={[{ niveau: 'attention', message: brouillon.message }]} />}
      {f.source === 'facturx' && !existante && (
        <Carte>
          <Texte gras>Lue automatiquement (Factur-X)</Texte>
          <Texte doux>Vérifiez les produits reliés et les quantités entrées en stock, puis enregistrez.</Texte>
        </Carte>
      )}

      {f.piece && (
        <Carte>
          <Ligne>
            <View style={{ flex: 1 }}>
              <Texte gras>Pièce jointe</Texte>
              <Texte doux>
                {f.piece.nom} · {fmt(f.piece.taille / 1024, 0)} Ko
              </Texte>
            </View>
            {ouverture ? <ActivityIndicator /> : <Bouton titre="Voir" variante="secondaire" onPress={voirPiece} />}
          </Ligne>
          {apercu && (
            <Pressable onPress={() => setApercu(null)}>
              <Image source={{ uri: apercu }} style={{ width: '100%', aspectRatio: 0.7, borderRadius: 8 }} resizeMode="contain" accessibilityLabel="Photo de la facture" />
            </Pressable>
          )}
        </Carte>
      )}
      {erreur && <ListeAlertes alertes={[{ niveau: 'danger', message: erreur }]} />}

      <Ligne>
        <Puce titre="Facture" actif={f.type === 'facture'} onPress={() => maj({ type: 'facture' })} />
        <Puce titre="Avoir" actif={f.type === 'avoir'} onPress={() => maj({ type: 'avoir' })} />
      </Ligne>
      <Champ label="Fournisseur" value={f.fournisseur} onChangeText={(v) => maj({ fournisseur: v })} placeholder="Coopérative…" />
      <Ligne>
        <View style={{ flex: 1 }}>
          <Champ label="Numéro" value={f.numero} onChangeText={(v) => maj({ numero: v })} autoCapitalize="characters" />
        </View>
        <View style={{ flex: 1 }}>
          <Champ label="Date (AAAA-MM-JJ)" value={f.date} onChangeText={(v) => maj({ date: v })} />
        </View>
      </Ligne>
      <Ligne>
        <View style={{ flex: 1 }}>
          <ChampNombre label="Total HT (€)" valeur={totaux.ht} onChange={(v) => setTotaux({ ...totaux, ht: v })} />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre label="TVA (€)" valeur={totaux.tva} onChange={(v) => setTotaux({ ...totaux, tva: v })} />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre label="TTC (€)" valeur={totaux.ttc} onChange={(v) => setTotaux({ ...totaux, ttc: v })} />
        </View>
      </Ligne>

      <SousTitre>Lignes ({f.lignes.length})</SousTitre>
      {f.lignes.length === 0 && <Texte doux>Ajoutez au moins les lignes de produits phyto ou d'engrais : ce sont elles qui entrent en stock.</Texte>}
      {f.lignes.map((l, i) => {
        const produit = d.produits.find((p) => p.id === l.produitId);
        return (
          <LigneEdit
            key={`${i}-${version}`}
            ligne={l}
            produit={produit}
            ouvert={choix === i}
            produits={produitsActifs}
            onChange={(x) => majLigne(i, x)}
            onChoisir={() => setChoix(choix === i ? null : i)}
            onRelier={(p) => relier(i, p)}
            onCreer={() => creerProduit(i)}
            onRetirer={() => retirerLigne(i)}
          />
        );
      })}
      <Bouton titre="＋ Ajouter une ligne" variante="secondaire" onPress={ajouterLigne} />

      <ListeAlertes
        alertes={[
          ...(tenter ? manques.map((m) => ({ niveau: 'bloquant' as const, message: m })) : []),
          ...(double ? [{ niveau: 'attention' as const, message: `Déjà enregistrée : ${double.fournisseur} n° ${double.numero} du ${double.date}.` }] : []),
          ...(ecart !== 0 && f.lignes.length > 0 ? [{ niveau: 'attention' as const, message: `La somme des lignes s'écarte du total HT de ${euros(ecart)}.` }] : []),
          ...(sansQuantite ? [{ niveau: 'attention' as const, message: `${sansQuantite} ligne(s) reliée(s) sans quantité en stock : elles n'entreront pas en stock.` }] : []),
        ]}
      />
      {nonReliees > 0 && f.lignes.length > 0 && (
        <Texte doux>{nonReliees} ligne(s) non reliée(s) (frais de port, services…) : elles restent dans la facture mais n'entrent pas en stock.</Texte>
      )}

      <Bouton titre="Enregistrer" onPress={enregistrer} />
      <Bouton titre={existante ? 'Supprimer la facture' : 'Annuler'} variante={existante ? 'danger' : 'secondaire'} onPress={supprimer} />
    </Ecran>
  );
}

function LigneEdit({
  ligne: l,
  produit,
  ouvert,
  produits,
  onChange,
  onChoisir,
  onRelier,
  onCreer,
  onRetirer,
}: {
  ligne: LigneFacture;
  produit?: Produit;
  ouvert: boolean;
  produits: Produit[];
  onChange: (l: Partial<LigneFacture>) => void;
  onChoisir: () => void;
  onRelier: (p: Produit | undefined) => void;
  onCreer: () => void;
  onRetirer: () => void;
}) {
  const [quantite, setQuantite] = useState(versTexte(l.quantite));
  const [montant, setMontant] = useState(versTexte(l.montantHT));
  const [stock, setStock] = useState(versTexte(l.quantiteStock));
  const [recherche, setRecherche] = useState('');

  const filtres = produits.filter((p) => !recherche.trim() || normaliser(p.nom).includes(normaliser(recherche)));

  return (
    <Carte>
      <Champ label="Libellé" value={l.libelle} onChangeText={(v) => onChange({ libelle: v })} />
      <Ligne>
        <View style={{ flex: 1 }}>
          <ChampNombre
            label={`Quantité${l.unite ? ` (${nomUnite(l.unite)})` : ''}`}
            valeur={quantite}
            onChange={(v) => {
              setQuantite(v);
              onChange({ quantite: lireNombre(v) ?? 0 });
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre
            label="Montant HT (€)"
            valeur={montant}
            onChange={(v) => {
              setMontant(v);
              onChange({ montantHT: lireNombre(v) ?? 0 });
            }}
          />
        </View>
      </Ligne>

      <Pressable onPress={onChoisir} accessibilityRole="button" style={{ paddingVertical: 6 }}>
        <Ligne>
          <Texte doux>Produit du stock :</Texte>
          {produit ? <Badge texte={produit.nom} ton="ok" /> : <Badge texte="Non relié" ton="attention" />}
          <Texte doux>{ouvert ? '▲' : '▼'}</Texte>
        </Ligne>
      </Pressable>

      {ouvert && (
        <View style={{ gap: 8, borderTopWidth: 1, borderColor: couleurs.bord, paddingTop: 8 }}>
          <Champ label="Chercher un produit" value={recherche} onChangeText={setRecherche} />
          <Ligne>
            {filtres.slice(0, 20).map((p) => (
              <Puce key={p.id} titre={p.nom} actif={p.id === l.produitId} onPress={() => onRelier(p)} />
            ))}
          </Ligne>
          <Bouton titre="Nouveau produit d'après ce libellé" variante="secondaire" onPress={onCreer} desactive={!l.libelle.trim()} />
          <Bouton titre="Pas un produit du stock (frais, service…)" variante="secondaire" onPress={() => onRelier(undefined)} />
        </View>
      )}

      {produit && (
        <ChampNombre
          label={`Entrée en stock (${produit.unite})`}
          valeur={stock}
          onChange={(v) => {
            setStock(v);
            onChange({ quantiteStock: lireNombre(v) });
          }}
          aide={
            l.quantiteStock && l.montantHT
              ? `Soit ${euros(l.montantHT / l.quantiteStock)} HT par ${produit.unite}.`
              : `Combien de ${produit.unite} au total (par exemple 4 bidons de 5 L = 20).`
          }
        />
      )}
      <Bouton titre="Retirer la ligne" variante="secondaire" onPress={onRetirer} />
    </Carte>
  );
}

