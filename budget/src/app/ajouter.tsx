// S04 Ajouter une dépense, S05 un revenu ou un versement d'épargne, S07 modifier une ligne.
// Parcours le plus court : + → montant → sous-catégorie (enregistre directement).

import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { categories, categorieDe, euros, frequentes, jourLocal, lireMontant, moisDe, reglages, versChamp, AIDE_GROUPES, libelleMois } from '../core/mois';
import { GROUPES, type Groupe, type Transaction, type TypeTransaction } from '../core/types';
import { nouvelId, remplacer, useStore } from '../data/store';
import { Alerte, Bascule, Bouton, Champ, confirmer, Ecran, Etiquette, Ligne, PastilleGroupe, PaveMontant, Puce, Texte, useToast } from '../ui/kit';
import { c, chiffres, type as t } from '../ui/theme';

const TITRES: Record<TypeTransaction, string> = { depense: 'Dépense', revenu: 'Revenu', epargne: 'Épargne' };

/** « 10/11/2026 » ou « 10/11 » → '2026-11-10' ; invalide → undefined. */
function lireDate(texte: string, annee: number): string | undefined {
  const m = texte.trim().match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  if (!m) return undefined;
  const j = Number(m[1]);
  const mo = Number(m[2]);
  const a = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : annee;
  const d = new Date(a, mo - 1, j);
  if (d.getMonth() !== mo - 1 || d.getDate() !== j) return undefined;
  return jourLocal(d);
}
const versDateFr = (jour: string) => jour.split('-').reverse().join('/');

export default function Ajouter() {
  const params = useLocalSearchParams<{ id?: string; type?: TypeTransaction; objectif?: string }>();
  const { donnees: d, modifier } = useStore();
  const toast = useToast();
  const navigation = useNavigation();
  const existante = params.id ? d.transactions.find((x) => x.id === params.id) : undefined;
  const edition = !!existante;

  const dernierGroupe = useMemo<Groupe>(() => {
    const derniere = [...d.transactions].filter((x) => x.type === 'depense').sort((a, b) => (b.maj ?? 0) - (a.maj ?? 0))[0];
    return derniere ? categorieDe(d, derniere.categorieId).groupe : 'survie';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [typeTx, setTypeTx] = useState<TypeTransaction>(existante?.type ?? params.type ?? 'depense');
  const [texte, setTexte] = useState(versChamp(existante?.montant));
  const [groupe, setGroupe] = useState<Groupe>(existante?.categorieId ? categorieDe(d, existante.categorieId).groupe : dernierGroupe);
  const [categorieId, setCategorieId] = useState<string | undefined>(existante?.categorieId);
  const [objectifId, setObjectifId] = useState<string | undefined>(existante?.objectifId ?? params.objectif);
  const [note, setNote] = useState(existante?.note ?? '');
  const aujourdhui = jourLocal();
  const hier = jourLocal(new Date(Date.now() - 86_400_000));
  const [jour, setJour] = useState(existante?.jour ?? aujourdhui);
  const [texteDate, setTexteDate] = useState(versDateFr(existante?.jour ?? aujourdhui));
  const [plus, setPlus] = useState(edition && (!!existante?.note || existante.jour !== aujourdhui));
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: edition ? `Modifier : ${TITRES[typeTx].toLowerCase()}` : 'Ajouter' });
  }, [navigation, edition, typeTx]);

  const montant = lireMontant(texte);
  const sousCats = categories(d).filter((x) => x.groupe === groupe);
  const objectifs = d.objectifs.filter((o) => !o.archive);
  const cleMois = moisDe(jour, reglages(d).jourDebutMois);
  const moisClos = d.mois.find((m) => m.id === cleMois)?.clos;

  const enregistrer = (catChoisie = categorieId) => {
    setErreur(null);
    if (!montant) return setErreur('Indiquez un montant.');
    if (typeTx === 'depense' && !catChoisie) return setErreur('Choisissez une catégorie.');
    const ligne: Transaction = {
      id: existante?.id ?? nouvelId(),
      jour,
      montant,
      type: typeTx,
      ...(typeTx === 'depense' ? { categorieId: catChoisie } : {}),
      ...(typeTx === 'epargne' && objectifId ? { objectifId } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    const avant = existante;
    modifier((x) => ({ ...x, transactions: remplacer(x.transactions, ligne) }));
    const quoi = typeTx === 'depense' ? `${categorieDe(d, catChoisie).nom} ${euros(montant)}` : `${TITRES[typeTx]} ${euros(montant)}`;
    toast({
      texte: edition ? `${quoi} modifiée` : `${quoi} ajoutée`,
      annuler: () =>
        modifier((x) => ({ ...x, transactions: avant ? remplacer(x.transactions, avant) : x.transactions.filter((y) => y.id !== ligne.id) })),
    });
    router.back();
  };

  const supprimer = async () => {
    if (!existante) return;
    if (!(await confirmer('Supprimer cette ligne ?', `${TITRES[existante.type]} de ${euros(existante.montant)} du ${versDateFr(existante.jour)}.`, 'Supprimer'))) return;
    modifier((x) => ({ ...x, transactions: x.transactions.filter((y) => y.id !== existante.id) }));
    toast({ texte: 'Ligne supprimée', annuler: () => modifier((x) => ({ ...x, transactions: remplacer(x.transactions, existante) })) });
    router.back();
  };

  const habituelles = !edition && typeTx === 'depense' ? frequentes(d, aujourdhui) : [];
  /** Une dépense habituelle : un toucher l'enregistre (à la date choisie). */
  const noterHabituelle = (f: (typeof habituelles)[number]) => {
    const ligne: Transaction = { id: nouvelId(), jour, montant: f.montant, type: 'depense', categorieId: f.categorieId, ...(f.note ? { note: f.note } : {}) };
    modifier((x) => ({ ...x, transactions: [...x.transactions, ligne] }));
    toast({
      texte: `${f.note ?? categorieDe(d, f.categorieId).nom} ${euros(f.montant)} ajoutée`,
      annuler: () => modifier((x) => ({ ...x, transactions: x.transactions.filter((y) => y.id !== ligne.id) })),
    });
    router.back();
  };

  const choisirSousCat = (id: string) => {
    setCategorieId(id);
    // Montant déjà tapé : toucher la catégorie enregistre (sauf en modification).
    if (!edition && montant) enregistrer(id);
  };

  if (params.id && !existante)
    return (
      <Ecran>
        <Texte>Cette ligne n’existe plus (supprimée sur un autre téléphone ?).</Texte>
        <Bouton titre="Retour" onPress={() => router.back()} />
      </Ecran>
    );

  return (
    <Ecran>
      <Bascule
        options={[
          { valeur: 'depense', titre: 'Dépense' },
          { valeur: 'revenu', titre: 'Revenu' },
          { valeur: 'epargne', titre: 'Épargne' },
        ]}
        valeur={typeTx}
        onChange={(v) => {
          setTypeTx(v);
          setErreur(null);
        }}
      />

      {habituelles.length && !texte ? (
        <View style={{ gap: 6 }}>
          <Etiquette>Habituelles · un toucher pour noter</Etiquette>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {habituelles.map((f) => (
              <PastilleGroupe
                key={`${f.categorieId}|${f.montant}|${f.note ?? ''}`}
                groupe={categorieDe(d, f.categorieId).groupe}
                libelle={`${f.note ?? categorieDe(d, f.categorieId).nom} ${euros(f.montant)}`}
                choisi={false}
                onPress={() => noterHabituelle(f)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View accessible accessibilityLabel={`Montant : ${montant ? euros(montant) : 'vide'}`} style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text testID="montant" style={[t.display, chiffres, { color: texte ? c.text : c.textMuted }]}>
          {texte || '0'} €
        </Text>
      </View>
      <PaveMontant texte={texte} onChange={setTexte} />

      {typeTx === 'depense' ? (
        <>
          <Etiquette>Catégorie</Etiquette>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GROUPES.map((g) => (
              <PastilleGroupe
                key={g}
                groupe={g}
                grande
                aide={AIDE_GROUPES[g]}
                choisi={groupe === g}
                onPress={() => {
                  setGroupe(g);
                  if (categorieId && categorieDe(d, categorieId).groupe !== g) setCategorieId(undefined);
                }}
              />
            ))}
          </View>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sousCats.map((s) => (
              <PastilleGroupe key={s.id} groupe={groupe} libelle={s.nom} choisi={categorieId === s.id} onPress={() => choisirSousCat(s.id)} />
            ))}
          </View>
          {!edition ? <Texte doux petit>Touchez la catégorie pour enregistrer.</Texte> : null}
        </>
      ) : null}

      {typeTx === 'epargne' ? (
        <>
          <Etiquette>Vers quel objectif ?</Etiquette>
          <Ligne>
            <Puce titre="Sans objectif" actif={!objectifId} onPress={() => setObjectifId(undefined)} />
            {objectifs.map((o) => (
              <Puce key={o.id} titre={o.nom} actif={objectifId === o.id} onPress={() => setObjectifId(o.id)} />
            ))}
          </Ligne>
          <Texte doux petit>Un versement range l’épargne déjà prévue : il ne baisse pas le reste à dépenser.</Texte>
        </>
      ) : null}
      {typeTx === 'revenu' ? <Texte doux petit>Un revenu en plus du budget prévu (prime, remboursement, vente). Il augmente le reste à dépenser.</Texte> : null}

      {plus ? (
        <>
          <Champ label="Note" value={note} onChangeText={setNote} placeholder={typeTx === 'depense' ? 'ex. marché, pharmacie' : ''} />
          <Etiquette>Date</Etiquette>
          <Ligne>
            <Puce
              titre="Aujourd’hui"
              actif={jour === aujourdhui}
              onPress={() => {
                setJour(aujourdhui);
                setTexteDate(versDateFr(aujourdhui));
              }}
            />
            <Puce
              titre="Hier"
              actif={jour === hier}
              onPress={() => {
                setJour(hier);
                setTexteDate(versDateFr(hier));
              }}
            />
          </Ligne>
          <Champ
            label="Autre date (jj/mm/aaaa)"
            value={texteDate}
            onChangeText={(v) => {
              setTexteDate(v);
              const j = lireDate(v, Number(aujourdhui.slice(0, 4)));
              if (j) setJour(j);
            }}
            erreur={lireDate(texteDate, Number(aujourdhui.slice(0, 4))) ? undefined : 'Date non reconnue'}
          />
        </>
      ) : (
        <Bouton titre="Ajouter une note ou changer la date" variante="discret" onPress={() => setPlus(true)} />
      )}

      {moisClos ? <Alerte texte={`Le mois de ${libelleMois(cleMois).toLowerCase()} est clos : cette ligne changera son bilan.`} /> : null}
      {erreur ? <Alerte ton="danger" texte={erreur} /> : null}

      <Bouton titre={edition ? 'Enregistrer' : `Enregistrer ${montant ? euros(montant) : ''}`.trim()} grand onPress={() => enregistrer()} />
      {edition ? <Bouton titre="Supprimer cette ligne" variante="danger" onPress={supprimer} /> : null}
    </Ecran>
  );
}
