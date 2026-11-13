// S47 : fiche d'un vin.

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { bouteillesDuVin, emplacement, etatGarde, fenetreGarde, LIBELLE_ETAT, lieuVin, nomCouleur, nomVin, PHRASE_ETAT, sortir, supprimerVin } from '../../../core/cave';
import type { Bouteille } from '../../../core/types';
import { aujourdhui, nouvelId, useStore } from '../../../data/store';
import {
  BarreBas,
  BarreCepage,
  BoutonCave,
  CarteCave,
  Curseur,
  EcranCave,
  Frise,
  PuceCave,
  PuceEmplacement,
  Service,
  Surtitre,
  T,
  Vignette,
} from '../../../ui/cave/kit';
import { anneeEnCours, useBarreClaire, usePhoto } from '../../../ui/cave/outils';
import { c, couleurEtat, police } from '../../../ui/cave/theme';
import { confirmer } from '../../../ui/kit';

const PASTILLES = ['#4a1259', '#8b4513', '#6b3a2a', '#a08968', '#5a6b2a', '#9a2a3a'];

export default function FicheVin() {
  useBarreClaire();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier } = useStore();
  const [actions, setActions] = useState(false);
  const vin = d.vins.find((v) => v.id === id);
  const photo = usePhoto(vin?.photo);
  const annee = anneeEnCours();
  if (!vin)
    return (
      <EcranCave>
        <T.texte doux>Ce vin n'existe plus.</T.texte>
      </EcranCave>
    );

  const etat = etatGarde(vin, annee);
  const f = fenetreGarde(vin);
  const bs = bouteillesDuVin(d, vin.id);
  const aRanger = bs.filter((b) => !b.meubleId).length;
  const degustations = d.degustations.filter((x) => x.vinId === vin.id).sort((a, b) => b.date.localeCompare(a.date));
  const p = vin.profil ?? {};
  const aProfil = [p.corps, p.tanins, p.acidite, p.sucre].some((x) => x != null);
  const service = [
    vin.tempMin != null || vin.tempMax != null ? { valeur: [vin.tempMin, vin.tempMax].filter((x) => x != null).join('-') + '°', titre: 'Température' } : null,
    vin.carafageH != null ? { valeur: `${String(vin.carafageH).replace('.', ',')}h`, titre: 'Carafage' } : null,
    f ? { valeur: `→ ${f.fin}`, titre: 'Garde' } : null,
  ].filter((x): x is { valeur: string; titre: string } => x != null);

  const ajouterUne = () => {
    const prix = bs.find((b) => b.prix != null)?.prix;
    const b: Bouteille = { id: nouvelId(), vinId: vin.id, entree: aujourdhui(), statut: 'cave', prix };
    modifier((x) => ({ ...x, bouteilles: [...x.bouteilles, b] }));
  };
  const offrir = async () => {
    const b = bs.find((x) => !x.meubleId) ?? bs[0];
    if (b && (await confirmer('Offrir une bouteille', 'Elle sort de la cave sans note de dégustation.', 'Offrir'))) modifier((x) => sortir(x, b.id, aujourdhui(), 'offerte'));
  };
  const supprimer = async () => {
    if (await confirmer('Supprimer ce vin', `${nomVin(vin)} disparaît, avec ses ${bs.length} bouteille(s) en cave et ses notes de dégustation.`, 'Supprimer')) {
      modifier((x) => supprimerVin(x, vin.id));
      router.back();
    }
  };

  return (
    <EcranCave
      bas={
        <BarreBas>
          <BoutonCave titre="Actions" variante="fantome" style={{ flex: 1 }} onPress={() => setActions(!actions)} />
          <BoutonCave titre="Déguster" style={{ flex: 1.6 }} desactive={bs.length === 0} onPress={() => router.push(`/cave/deguster/${vin.id}`)} />
        </BarreBas>
      }
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text numberOfLines={1} style={{ fontFamily: police.serif, fontSize: 20, color: c.texte, maxWidth: 260 }}>
              {vin.domaine}
              {vin.millesime ? <Text style={{ fontFamily: police.mono, fontSize: 16, color: c.orTexte }}>{`  ${vin.millesime}`}</Text> : null}
            </Text>
          ),
        }}
      />

      {actions ? (
        <CarteCave haute>
          <Surtitre>Actions</Surtitre>
          <BoutonCave titre="Modifier la fiche" variante="creme" onPress={() => router.push(`/cave/modifier/${vin.id}`)} />
          <BoutonCave titre="Ajouter une bouteille de ce vin" variante="fantome" onPress={ajouterUne} />
          {bs.length ? <BoutonCave titre="Offrir une bouteille" variante="fantome" onPress={offrir} /> : null}
          <BoutonCave titre="Supprimer ce vin" variante="lien" onPress={supprimer} />
        </CarteCave>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Vignette couleur={vin.couleur} photo={photo} taille={110} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <T.vin taille={24}>{nomVin(vin)}</T.vin>
          <T.texte doux>{[lieuVin(vin), nomCouleur(vin.couleur)].filter(Boolean).join(' · ')}</T.texte>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: couleurEtat[etat] }} />
            <Text style={{ fontFamily: police.sansDemi, fontSize: 15, color: c.texte }}>{LIBELLE_ETAT[etat]}</Text>
          </View>
        </View>
      </View>

      {f ? (
        <CarteCave>
          <Surtitre>Fenêtre de garde</Surtitre>
          <Frise fenetre={f} millesime={vin.millesime} annee={annee} />
          <T.texte>{PHRASE_ETAT[etat]}</T.texte>
          {!vin.garde ? <T.texte doux taille={13}>Estimation d’après la couleur et la région. Modifiez la fiche pour la corriger.</T.texte> : null}
        </CarteCave>
      ) : null}

      <Surtitre droite={<T.mono couleur={c.doux}>{`×${bs.length}`}</T.mono>}>{bs.length > 1 ? 'Mes bouteilles' : 'Ma bouteille'}</Surtitre>
      {bs.length === 0 ? <T.texte doux>Plus aucune bouteille en cave.</T.texte> : null}
      <View style={{ gap: 8 }}>
        {bs.map((b) => (
          <PuceEmplacement
            key={b.id}
            texte={emplacement(d, b)}
            onPress={() => (b.meubleId ? router.push(`/cave/plan?b=${b.id}`) : router.push(`/cave/ranger?vin=${vin.id}`))}
          />
        ))}
      </View>
      {aRanger > 0 && d.meubles.length > 0 ? <BoutonCave titre={`Ranger ${aRanger > 1 ? `ces ${aRanger} bouteilles` : 'cette bouteille'}`} variante="creme" onPress={() => router.push(`/cave/ranger?vin=${vin.id}`)} /> : null}

      {aProfil ? (
        <>
          <Surtitre>Profil gustatif</Surtitre>
          <CarteCave>
            {p.corps != null ? <Curseur gauche="Léger" droite="Puissant" valeur={p.corps} /> : null}
            {p.tanins != null ? <Curseur gauche="Souple" droite="Tannique" valeur={p.tanins} /> : null}
            {p.acidite != null ? <Curseur gauche="Doux" droite="Acide" valeur={p.acidite} /> : null}
            {p.sucre != null ? <Curseur gauche="Sec" droite="Moelleux" valeur={p.sucre} /> : null}
          </CarteCave>
        </>
      ) : null}

      {vin.aromes?.length ? (
        <>
          <Surtitre>Arômes dominants</Surtitre>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {vin.aromes.map((a, i) => (
              <PuceCave key={a} titre={a} pastille={PASTILLES[i % PASTILLES.length]} />
            ))}
          </View>
        </>
      ) : null}

      {vin.cepages?.length ? (
        <>
          <Surtitre>Cépages</Surtitre>
          <View style={{ gap: 6 }}>
            {vin.cepages.map((x) => (
              <BarreCepage key={x.nom} nom={x.nom} pct={x.pct} />
            ))}
          </View>
        </>
      ) : null}

      {service.length ? (
        <>
          <Surtitre>Service</Surtitre>
          <Service colonnes={service} />
        </>
      ) : null}

      {vin.accords ? (
        <>
          <Surtitre>À table</Surtitre>
          <T.italique>{vin.accords}</T.italique>
        </>
      ) : null}
      {vin.notes ? (
        <>
          <Surtitre>Notes</Surtitre>
          <T.texte>{vin.notes}</T.texte>
        </>
      ) : null}

      {degustations.length ? (
        <>
          <Surtitre>Mes dégustations</Surtitre>
          {degustations.map((x) => (
            <CarteCave key={x.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T.mono couleur={c.doux}>{x.date.split('-').reverse().join('/')}</T.mono>
                {x.note != null ? <T.mono>{`${String(x.note).replace('.', ',')}/20`}</T.mono> : null}
              </View>
              {x.commentaire ? <T.italique>{x.commentaire}</T.italique> : null}
              {[x.robe, x.aromes, x.avecQui ? `avec ${x.avecQui}` : ''].filter(Boolean).length ? <T.texte doux>{[x.robe, x.aromes, x.avecQui ? `avec ${x.avecQui}` : ''].filter(Boolean).join(' · ')}</T.texte> : null}
            </CarteCave>
          ))}
        </>
      ) : null}
    </EcranCave>
  );
}
