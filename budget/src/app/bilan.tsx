// S08 Bilan du mois : les 4 questions avec les chiffres, puis 3 réponses écrites.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { bilanDe, chiffresBilan, decalerMois, euros, jourLocal, libelleMois, moisDe, NOMS_GROUPES, reglages } from '../core/mois';
import { GROUPES } from '../core/types';
import { remplacer, useStore } from '../data/store';
import { Alerte, Bouton, Carte, Champ, Ecran, Ligne, SousTitre, Texte } from '../ui/kit';
import { c, chiffres, type as t } from '../ui/theme';

function Question({ n, question, reponse, detail }: { n: number; question: string; reponse: string; detail?: string }) {
  return (
    <Carte>
      <Texte doux petit>
        {n}. {question}
      </Texte>
      <Text style={[t.xl, chiffres, { color: c.text }]}>{reponse}</Text>
      {detail ? <Texte doux petit>{detail}</Texte> : null}
    </Carte>
  );
}

export default function Bilan() {
  const { donnees: d, modifier } = useStore();
  const params = useLocalSearchParams<{ mois?: string }>();
  const cle = params.mois ?? moisDe(jourLocal(), reglages(d).jourDebutMois);
  const mois = d.mois.find((m) => m.id === cle);
  const existant = bilanDe(d, cle);
  const b = chiffresBilan(d, cle);
  const [marche, setMarche] = useState(existant?.ceQuiAMarche ?? '');
  const [trop, setTrop] = useState(existant?.tropDepense ?? '');
  const [changer, setChanger] = useState(existant?.aChanger ?? '');

  if (!mois)
    return (
      <Ecran>
        <Texte>Ce mois n’a pas été préparé : il n’y a pas de bilan à faire.</Texte>
        <Bouton titre="Retour" onPress={() => router.back()} />
      </Ecran>
    );

  const enregistrer = (clore: boolean) => {
    modifier((x) => {
      let r = { ...x, bilans: remplacer(x.bilans, { id: cle, ceQuiAMarche: marche.trim(), tropDepense: trop.trim(), aChanger: changer.trim() }) };
      if (clore) r = { ...r, mois: r.mois.map((m) => (m.id === cle ? { ...m, clos: true } : m)) };
      return r;
    });
    if (clore) {
      const suivant = decalerMois(cle, 1);
      if (!d.mois.some((m) => m.id === suivant) && suivant <= moisDe(jourLocal(), reglages(d).jourDebutMois)) router.replace({ pathname: '/preparer', params: { mois: suivant } });
      else router.back();
    } else router.back();
  };

  const ecart = b.ecartMoisPrecedent;
  return (
    <Ecran>
      <SousTitre>{libelleMois(cle)}</SousTitre>
      {mois.clos ? <Alerte ton="ok" texte="Ce mois est clos. Vous pouvez encore relire et corriger le bilan." /> : null}
      <Question n={1} question="Combien aviez-vous ?" reponse={euros(b.avais)} detail="Revenus du mois, moins les charges fixes." />
      <Question n={2} question="Combien vouliez-vous mettre de côté ?" reponse={euros(b.voulaisEpargner)} />
      <Carte>
        <Texte doux petit>3. Combien avez-vous dépensé ?</Texte>
        <Text style={[t.xl, chiffres, { color: c.text }]}>{euros(b.depense)}</Text>
        {GROUPES.map((g) => (
          <Ligne key={g} entre>
            <Texte>{NOMS_GROUPES[g]}</Texte>
            <Texte>
              {euros(b.parGroupe[g])}
              {ecart && ecart[g] !== 0 ? <Texte ton={ecart[g] > 0 ? 'danger' : 'success'} petit>{`  ${ecart[g] > 0 ? '+' : '−'}${euros(Math.abs(ecart[g]))} vs mois d’avant`}</Texte> : null}
            </Texte>
          </Ligne>
        ))}
      </Carte>
      <Carte>
        <Texte doux petit>Ce qui est resté</Texte>
        <Text style={[t.xl, chiffres, { color: b.objectifAtteint ? c.success : c.danger }]}>{euros(b.epargne)}</Text>
        <Texte ton={b.objectifAtteint ? 'success' : 'danger'}>
          {b.objectifAtteint ? (b.epargne > b.voulaisEpargner ? `Objectif atteint, avec ${euros(b.epargne - b.voulaisEpargner)} de plus.` : 'Objectif atteint.') : `Il manque ${euros(b.voulaisEpargner - b.epargne)} sur l’objectif.`}
        </Texte>
      </Carte>

      <SousTitre>4. Comment faire mieux ?</SousTitre>
      <Texte doux petit>Deux minutes, quelques mots suffisent. Vous les relirez au prochain bilan.</Texte>
      <Champ label="Ce qui a bien marché" value={marche} onChangeText={setMarche} multiline />
      <Champ label="Là où j’ai trop dépensé" value={trop} onChangeText={setTrop} multiline />
      <Champ label="Ce que je change le mois prochain" value={changer} onChangeText={setChanger} multiline />
      {(() => {
        const avant = bilanDe(d, decalerMois(cle, -1));
        return avant?.aChanger ? (
          <View>
            <Alerte ton="ok" texte={`Le mois dernier, vous vouliez changer : « ${avant.aChanger} »`} />
          </View>
        ) : null;
      })()}
      {mois.clos ? (
        <Bouton titre="Enregistrer" grand onPress={() => enregistrer(false)} />
      ) : (
        <>
          <Bouton titre="Clore le mois" grand onPress={() => enregistrer(true)} />
          <Bouton titre="Enregistrer sans clore" variante="discret" onPress={() => enregistrer(false)} />
        </>
      )}
    </Ecran>
  );
}
