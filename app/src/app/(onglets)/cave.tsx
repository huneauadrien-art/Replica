// S40 / S42 : Ma cave, en liste ou en plan.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  aBoireAvant,
  COULEURS,
  emplacement,
  enCave,
  exporterCave,
  fenetreGarde,
  filtrer,
  lieuVin,
  nomVin,
  PHRASE_ETAT,
  reparerCases,
  resumeCave,
  vinDuSoir,
  vinsEnCave,
  type Filtre,
} from '../../core/cave';
import type { Donnees, Vin } from '../../core/types';
import { partagerTexte } from '../../data/fichiers';
import { useStore } from '../../data/store';
import {
  Bascule,
  BoutonCave,
  BoutonRond,
  CarteCave,
  ChampCave,
  EcranCave,
  GrandChiffre,
  Jauge,
  LigneVin,
  PuceCave,
  PuceEmplacement,
  Surtitre,
  T,
  Vignette,
} from '../../ui/cave/kit';
import { Plan } from '../../ui/cave/Plan';
import { anneeEnCours, euros, salutation, useBarreClaire, usePhoto } from '../../ui/cave/outils';
import { c, couleurEtat, police, rayon } from '../../ui/cave/theme';
import { informer } from '../../ui/kit';

export default function Cave() {
  useBarreClaire();
  const { donnees: d, modifier } = useStore();
  const haut = useSafeAreaInsets().top;
  const params = useLocalSearchParams<{ vue?: string; b?: string }>();
  const [vue, setVue] = useState<'liste' | 'plan'>(params.vue === 'plan' ? 'plan' : 'liste');
  const [filtre, setFiltre] = useState<Filtre>('tout');
  const [recherche, setRecherche] = useState('');
  const annee = anneeEnCours();

  useEffect(() => {
    if (params.vue === 'plan' || params.vue === 'liste') setVue(params.vue);
  }, [params.vue, params.b]);

  // Deux téléphones ont pu ranger dans la même case hors ligne : on répare à l'affichage.
  useEffect(() => {
    if (reparerCases(d) !== d) modifier(reparerCases);
  }, [d, modifier]);

  const resume = resumeCave(d, annee);
  const vins = useMemo(() => vinsEnCave(d, annee), [d, annee]);
  const soir = vinDuSoir(d, annee);
  const urgents = aBoireAvant(d, annee, annee + 1);
  const visibles = filtrer(vins, filtre, recherche);

  const exporter = () =>
    partagerTexte(`cave-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + exporterCave(d, annee), 'text/csv').catch((e) =>
      informer("L'export n'a pas marché", (e as Error).message),
    );

  const details = [
    `bouteille${resume.bouteilles > 1 ? 's' : ''}`,
    resume.bouteilles ? `${resume.pretes} prête${resume.pretes > 1 ? 's' : ''}` : null,
    resume.valeur ? `≈ ${euros(resume.valeur)}` : null,
    resume.sansPrix ? `${resume.sansPrix} sans prix` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <EcranCave bas={<BoutonRond label="Ajouter une bouteille" onPress={() => router.push('/cave/nouveau')} />}>
      <View style={{ height: haut }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 10 }}>
          <Surtitre>{salutation()}</Surtitre>
          <GrandChiffre nombre={resume.bouteilles} details={details} />
        </View>
        <BoutonCave titre="Mes meubles" variante="fantome" onPress={() => router.push('/cave/meubles')} style={{ minHeight: 44, paddingHorizontal: 14 }} />
      </View>

      <Bascule
        options={[
          { id: 'liste', titre: 'Liste' },
          { id: 'plan', titre: 'Plan' },
        ]}
        valeur={vue}
        onChange={setVue}
      />

      {d.vins.length === 0 && d.meubles.length === 0 ? (
        <Bienvenue />
      ) : vue === 'liste' ? (
        <>
          {soir ? <CarteDuSoir d={d} vin={soir.vin} etat={soir.etat} autres={Math.max(0, resume.pretes - 1)} /> : null}

          {resume.bouteilles > 0 ? (
            <Jauge
              parts={[
                { titre: 'Prêt', nombre: resume.parEtat.pret, couleur: couleurEtat.pret },
                { titre: 'Apogée', nombre: resume.parEtat.apogee, couleur: couleurEtat.apogee },
                { titre: 'À boire vite', nombre: resume.parEtat.vite + resume.parEtat.passe, couleur: couleurEtat.vite },
                { titre: 'À garder', nombre: resume.parEtat.jeune, couleur: c.bord2 },
              ]}
            />
          ) : null}

          {resume.aRanger > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/cave/ranger')} style={styles.bandeau}>
              <Text style={styles.bandeauTexte}>
                {resume.aRanger} bouteille{resume.aRanger > 1 ? 's' : ''} à ranger
              </Text>
              <Text style={styles.bandeauTexte}>Ranger ›</Text>
            </Pressable>
          ) : null}

          {urgents.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Surtitre>{`Boire avant ${annee + 2}`}</Surtitre>
              {urgents.slice(0, 5).map((x) => (
                <LigneVinAvecPhoto key={x.vin.id} vin={x.vin} nombre={x.nombre} etat={x.etat} echeance={String(fenetreGarde(x.vin)?.apogeeFin ?? '')} />
              ))}
            </View>
          ) : null}

          <Surtitre>Mes bouteilles</Surtitre>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <PuceCave titre="Tout" actif={filtre === 'tout'} onPress={() => setFiltre('tout')} />
            <PuceCave titre="Prêtes à boire" actif={filtre === 'pretes'} onPress={() => setFiltre('pretes')} />
            {COULEURS.map((co) => (
              <PuceCave key={co.id} titre={co.nom} actif={filtre === co.id} onPress={() => setFiltre(co.id)} />
            ))}
          </ScrollView>
          {vins.length > 6 ? <ChampCave label="Chercher" value={recherche} onChangeText={setRecherche} placeholder="Domaine, appellation, millésime" /> : null}
          {visibles.length === 0 ? (
            <T.texte doux>{vins.length === 0 ? 'Aucune bouteille en cave. Touchez le rond rouge pour en ajouter une.' : 'Aucun vin ne correspond.'}</T.texte>
          ) : (
            visibles.map((x) => <LigneVinAvecPhoto key={x.vin.id} vin={x.vin} nombre={x.nombre} etat={x.etat} />)
          )}

          <View style={{ gap: 10, marginTop: 8 }}>
            <BoutonCave titre="Carnet de dégustation" variante="fantome" onPress={() => router.push('/cave/carnet')} />
            {resume.bouteilles > 0 ? <BoutonCave titre="Exporter la cave (Excel)" variante="lien" onPress={exporter} /> : null}
          </View>
        </>
      ) : (
        <Plan d={d} miseEnAvant={params.b} />
      )}
    </EcranCave>
  );
}

function Bienvenue() {
  return (
    <CarteCave haute>
      <T.vin>Votre cave, rangée dans votre poche</T.vin>
      <T.texte>Ajoutez vos bouteilles, dessinez vos casiers, et l'app vous dit lesquelles ouvrir, et où elles sont.</T.texte>
      <BoutonCave titre="Ajouter une bouteille" onPress={() => router.push('/cave/nouveau')} />
      <BoutonCave titre="Dessiner mon premier casier" variante="fantome" onPress={() => router.push('/cave/meubles')} />
    </CarteCave>
  );
}

function CarteDuSoir({ d, vin, etat, autres }: { d: Donnees; vin: Vin; etat: Parameters<typeof Vignette>[0]['etat']; autres: number }) {
  const photo = usePhoto(vin.photo);
  const b = enCave(d).find((x) => x.vinId === vin.id && x.meubleId) ?? enCave(d).find((x) => x.vinId === vin.id);
  return (
    <CarteCave haute>
      <Surtitre mono>À boire ce soir</Surtitre>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Vignette couleur={vin.couleur} photo={photo} taille={72} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <T.vin lignes={2}>
            {nomVin(vin)}
            {vin.millesime ? ` ${vin.millesime}` : ''}
          </T.vin>
          {lieuVin(vin) ? <T.texte doux>{lieuVin(vin)}</T.texte> : null}
          <T.texte>{PHRASE_ETAT[etat ?? 'pret']}</T.texte>
        </View>
      </View>
      {b ? <PuceEmplacement texte={emplacement(d, b)} onPress={() => (b.meubleId ? router.setParams({ vue: 'plan', b: b.id }) : router.push(`/cave/ranger?vin=${vin.id}`))} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BoutonCave titre="Voir la bouteille" variante="creme" onPress={() => router.push(`/cave/vin/${vin.id}`)} style={{ flex: 1 }} />
        {autres > 0 ? <Text style={[styles.lien]}>{`${autres} autre${autres > 1 ? 's' : ''} prête${autres > 1 ? 's' : ''}`}</Text> : null}
      </View>
    </CarteCave>
  );
}

function LigneVinAvecPhoto({ vin, nombre, etat, echeance }: { vin: Vin; nombre: number; etat: Parameters<typeof LigneVin>[0]['etat']; echeance?: string }) {
  const photo = usePhoto(vin.photo);
  return (
    <LigneVin
      titre={`${nomVin(vin)}${vin.millesime ? ` ${vin.millesime}` : ''}`}
      sousTitre={lieuVin(vin) || COULEURS.find((x) => x.id === vin.couleur)!.nom}
      nombre={nombre}
      couleur={vin.couleur}
      etat={etat}
      photo={photo}
      echeance={echeance}
      onPress={() => router.push(`/cave/vin/${vin.id}`)}
    />
  );
}

const styles = StyleSheet.create({
  bandeau: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: c.orSombre, borderRadius: rayon.bouton, padding: 14, minHeight: 50 },
  bandeauTexte: { fontFamily: police.sansMoyen, fontSize: 15, color: c.orClair },
  lien: { fontFamily: police.sansMoyen, fontSize: 16, color: c.texte2 },
});
