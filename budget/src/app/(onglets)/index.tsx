// S02 Accueil du mois : reste à dépenser, les 4 catégories, dernières lignes.

import { router } from 'expo-router';
import { View } from 'react-native';
import { bilanDe, bilansEnRetard, bornesMois, ecartJours, euros, jourLocal, libelleMois, reglages, resteParSemaine, resume, transactionsDuMois, AIDE_GROUPES, NOMS_GROUPES } from '../../core/mois';
import { GROUPES } from '../../core/types';
import { useStore } from '../../data/store';
import { Alerte, Bouton, BoutonAjouter, Carte, CarteChiffre, Ecran, Jauge, LigneTransaction, SelecteurMois, SousTitre, Texte, Vide } from '../../ui/kit';
import { libelleLigne } from '../../ui/libelles';
import { useMoisChoisi } from '../../ui/moisChoisi';
import { c, rayon } from '../../ui/theme';

export default function Mois() {
  const { donnees: d, pret } = useStore();
  const { cle, courant, aller } = useMoisChoisi();
  if (!pret) return <Ecran>{null}</Ecran>;
  const r = resume(d, cle);
  const aujourdhui = jourLocal();
  const { au } = bornesMois(cle, reglages(d).jourDebutMois);
  const retard = cle === courant ? bilansEnRetard(d, courant) : [];
  const finProche = cle === courant && ecartJours(aujourdhui, au) <= 2;
  const bilanFait = !!bilanDe(d, cle);
  const dernieres = transactionsDuMois(d, cle).slice(0, 5);
  const ajouter = () => router.push('/ajouter');

  return (
    <View style={{ flex: 1 }}>
      <Ecran avecBoutonAjouter>
        <SelecteurMois libelle={libelleMois(cle)} precedent={() => aller(-1)} suivant={cle < courant ? () => aller(1) : undefined} badge={r.mois?.clos ? 'Clos' : undefined} />

        {retard.map((m) => (
          <Carte key={m} onPress={() => router.push({ pathname: '/bilan', params: { mois: m } })} etiquette={`Faire le bilan de ${libelleMois(m)}`}>
            <Texte gras ton="warning">Le bilan de {libelleMois(m).toLowerCase()} n’est pas fait.</Texte>
            <Texte doux petit>Deux minutes pour regarder le mois passé. Toucher pour le faire.</Texte>
          </Carte>
        ))}

        {!r.mois ? (
          <Carte>
            <Vide
              titre={cle === courant ? 'Le mois n’est pas encore préparé.' : 'Ce mois n’a pas été préparé.'}
              texte={d.mois.length === 0 ? 'Notez vos revenus et vos charges fixes, puis décidez d’abord combien mettre de côté. Le reste, c’est ce que vous pouvez dépenser.' : undefined}
            >
              <Bouton titre="Préparer le mois" grand onPress={() => router.push({ pathname: '/preparer', params: { mois: cle } })} />
            </Vide>
            {d.mois.length === 0 ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Texte gras>Chaque dépense va dans une des 4 catégories :</Texte>
                {GROUPES.map((g) => (
                  <Texte key={g} doux petit>
                    • {NOMS_GROUPES[g]} : {AIDE_GROUPES[g].toLowerCase()}
                  </Texte>
                ))}
                <Texte doux petit>En fin de mois, un petit bilan prépare le mois suivant.</Texte>
              </View>
            ) : null}
          </Carte>
        ) : (
          <>
            <CarteChiffre
              libelle="Reste à dépenser"
              montant={r.reste}
              ton={r.ton}
              sousLigne={r.reste < 0 ? `Dépassé de ${euros(-r.reste)} sur ${euros(r.disponible)} disponibles` : `sur ${euros(r.disponible)} disponibles · ${euros(r.epargneVisee)} mis de côté`}
            />
            {cle === courant && r.reste > 0 ? (
              <Texte doux petit>
                Soit {euros(resteParSemaine(d, cle, aujourdhui).parSemaine)} par semaine jusqu’au {Number(au.slice(8))} {libelleMois(cle).split(' ')[0].toLowerCase()}.
              </Texte>
            ) : null}
            {r.ton === 'depasse' ? <Alerte ton="danger" texte="Le budget du mois est dépassé : la différence sera prise sur l’épargne prévue." /> : null}
            <Carte>
              {GROUPES.map((g) => (
                <Jauge key={g} groupe={g} depense={r.parGroupe[g]} budget={r.mois?.budgets[g]} />
              ))}
            </Carte>
            {finProche || cle < courant ? (
              <Bouton titre={bilanFait ? 'Revoir le bilan' : 'Faire le bilan du mois'} variante={bilanFait ? 'secondaire' : 'principal'} onPress={() => router.push({ pathname: '/bilan', params: { mois: cle } })} />
            ) : null}
          </>
        )}

        {dernieres.length ? (
          <>
            <SousTitre>Dernières lignes</SousTitre>
            <View style={{ borderRadius: rayon.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
              {dernieres.map((t) => {
                const l = libelleLigne(d, t);
                return <LigneTransaction key={t.id} titre={l.titre} sousTitre={l.sous} montant={t.montant} sens={t.type} groupe={l.groupe} onPress={() => router.push({ pathname: '/ajouter', params: { id: t.id } })} />;
              })}
            </View>
            <Bouton titre="Toutes les lignes du mois" variante="discret" onPress={() => router.push('/depenses')} />
          </>
        ) : r.mois ? (
          <Texte doux>Aucune dépense notée ce mois-ci. Touchez + pour en ajouter une.</Texte>
        ) : null}
        {r.mois && cle === courant ? <Bouton titre="Modifier le budget du mois" variante="discret" onPress={() => router.push({ pathname: '/preparer', params: { mois: cle } })} /> : null}
      </Ecran>
      {cle === courant ? <BoutonAjouter onPress={ajouter} /> : null}
    </View>
  );
}
