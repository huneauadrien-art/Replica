// S03 Préparer le mois : revenus, charges fixes, épargne décidée d'abord, budgets par catégorie.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { decalerMois, euros, jourLocal, libelleMois, lireMontant, moisDe, NOMS_GROUPES, propositionMois, reglages, versChamp } from '../core/mois';
import { GROUPES, type Groupe, type Mois } from '../core/types';
import { nouvelId, remplacer, useStore } from '../data/store';
import { Alerte, Bouton, Carte, CarteChiffre, Champ, ChampMontant, Ecran, Ligne, Puce, SousTitre, Texte } from '../ui/kit';
import { c, type as t } from '../ui/theme';

type LigneSaisie = { cle: string; libelle: string; montant: string };

export default function Preparer() {
  const { donnees: d, modifier } = useStore();
  const params = useLocalSearchParams<{ mois?: string }>();
  const cle = params.mois ?? moisDe(jourLocal(), reglages(d).jourDebutMois);
  const existant = d.mois.find((m) => m.id === cle);
  const base = propositionMois(d, cle);
  const reprise = !existant && d.mois.some((m) => m.id === decalerMois(cle, -1));

  const [revenus, setRevenus] = useState(versChamp(base.revenusPrevus || undefined));
  const [charges, setCharges] = useState<LigneSaisie[]>(base.chargesFixes.map((x, i) => ({ cle: String(i), libelle: x.libelle, montant: versChamp(x.montant) })));
  const [epargne, setEpargne] = useState(versChamp(base.epargneVisee || undefined));
  const [budgets, setBudgets] = useState<Record<Groupe, string>>(Object.fromEntries(GROUPES.map((g) => [g, versChamp(base.budgets[g])])) as Record<Groupe, string>);
  const [voirBudgets, setVoirBudgets] = useState(GROUPES.some((g) => base.budgets[g]));
  const [retenir, setRetenir] = useState(d.recurrentes.length === 0);
  const [erreur, setErreur] = useState<string | null>(null);

  const vRevenus = lireMontant(revenus) ?? 0;
  const vCharges = charges.reduce((s, l) => s + (lireMontant(l.montant) ?? 0), 0);
  const vEpargne = lireMontant(epargne) ?? 0;
  const disponible = vRevenus - vCharges - vEpargne;

  const changerCharge = (k: string, champ: 'libelle' | 'montant', v: string) => setCharges((l) => l.map((x) => (x.cle === k ? { ...x, [champ]: v } : x)));

  const enregistrer = () => {
    setErreur(null);
    if (revenus && lireMontant(revenus) == null) return setErreur('Le montant des revenus n’est pas reconnu.');
    if (epargne && lireMontant(epargne) == null) return setErreur('Le montant de l’épargne n’est pas reconnu.');
    const lignes = charges.filter((l) => l.libelle.trim() || l.montant.trim());
    if (lignes.some((l) => lireMontant(l.montant) == null)) return setErreur('Une charge fixe a un montant non reconnu.');
    const mois: Mois = {
      id: cle,
      revenusPrevus: vRevenus,
      chargesFixes: lignes.map((l) => ({ libelle: l.libelle.trim() || 'Charge', montant: lireMontant(l.montant) ?? 0 })),
      epargneVisee: vEpargne,
      budgets: voirBudgets ? (Object.fromEntries(GROUPES.flatMap((g) => (lireMontant(budgets[g]) ? [[g, lireMontant(budgets[g])]] : []))) as Mois['budgets']) : {},
      clos: existant?.clos ?? false,
    };
    modifier((x) => {
      let r = { ...x, mois: remplacer(x.mois, mois) };
      if (retenir && x.recurrentes.length === 0) {
        const rec = [
          ...(mois.revenusPrevus ? [{ id: nouvelId(), libelle: 'Revenus du mois', montant: mois.revenusPrevus, type: 'revenu' as const, active: true }] : []),
          ...mois.chargesFixes.map((ch) => ({ id: nouvelId(), libelle: ch.libelle, montant: ch.montant, type: 'chargeFixe' as const, active: true })),
        ];
        r = { ...r, recurrentes: rec };
      }
      return r;
    });
    router.back();
  };

  return (
    <Ecran>
      <SousTitre>{libelleMois(cle)}</SousTitre>
      {reprise ? <Alerte ton="ok" texte="Repris du mois précédent. Modifiez ce qui change ce mois-ci." /> : null}
      {!existant && !reprise && d.recurrentes.some((r) => r.active) ? <Alerte ton="ok" texte="Rempli avec vos revenus et charges fixes habituels." /> : null}

      <Carte>
        <Texte gras>1. Combien d’argent rentre ce mois-ci ?</Texte>
        <ChampMontant label="Revenus prévus (€)" value={revenus} onChangeText={setRevenus} aide="Salaires, allocations, pensions… le total du mois." />
      </Carte>

      <Carte>
        <Texte gras>2. Les charges fixes</Texte>
        <Texte doux petit>Ce qui part tous les mois quoi qu’il arrive : loyer ou crédit, assurances, box, abonnements.</Texte>
        {charges.map((l) => (
          <View key={l.cle} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 2 }}>
              <Champ label="Libellé" value={l.libelle} onChangeText={(v) => changerCharge(l.cle, 'libelle', v)} placeholder="Loyer" />
            </View>
            <View style={{ flex: 1 }}>
              <ChampMontant label="€" value={l.montant} onChangeText={(v) => changerCharge(l.cle, 'montant', v)} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${l.libelle || 'cette charge'}`} onPress={() => setCharges((x) => x.filter((y) => y.cle !== l.cle))} style={{ width: 48, height: 50, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[t.lg, { color: c.danger }]}>×</Text>
            </Pressable>
          </View>
        ))}
        <Bouton titre="+ Ajouter une charge fixe" variante="secondaire" onPress={() => setCharges((x) => [...x, { cle: nouvelId(), libelle: '', montant: '' }])} />
        {vCharges ? <Texte doux>Total : {euros(vCharges)}</Texte> : null}
      </Carte>

      <Carte>
        <Texte gras>3. Combien voulez-vous mettre de côté ?</Texte>
        <Texte doux petit>On décide l’épargne avant de dépenser, pas avec ce qui reste.</Texte>
        <ChampMontant label="Épargne visée (€)" value={epargne} onChangeText={setEpargne} />
      </Carte>

      <CarteChiffre petit libelle="Vous pourrez dépenser" montant={disponible} ton={disponible < 0 ? 'depasse' : 'normal'} sousLigne={disponible < 0 ? 'L’épargne visée dépasse ce qui reste après les charges.' : 'pour vivre ce mois-ci'} />

      <Carte>
        <Ligne entre>
          <Texte gras>Plafonds par catégorie</Texte>
          <Puce titre={voirBudgets ? 'Oui' : 'Non'} actif={voirBudgets} onPress={() => setVoirBudgets((v) => !v)} />
        </Ligne>
        <Texte doux petit>Facultatif : une limite pour Survie, Optionnel, Culture ou Extra.</Texte>
        {voirBudgets
          ? GROUPES.map((g) => <ChampMontant key={g} label={`${NOMS_GROUPES[g]} (€)`} value={budgets[g]} onChangeText={(v) => setBudgets((b) => ({ ...b, [g]: v }))} />)
          : null}
      </Carte>

      {d.recurrentes.length === 0 ? (
        <Ligne>
          <Puce titre={retenir ? '✓ Retenir pour les mois suivants' : 'Retenir pour les mois suivants'} actif={retenir} onPress={() => setRetenir((v) => !v)} />
        </Ligne>
      ) : null}

      {erreur ? <Alerte ton="danger" texte={erreur} /> : null}
      <Bouton titre="Enregistrer le mois" grand onPress={enregistrer} />
    </Ecran>
  );
}
