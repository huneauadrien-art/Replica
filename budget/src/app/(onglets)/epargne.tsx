// S10 Objectifs d'épargne et leur avancement.

import { router } from 'expo-router';
import { avancement, euros, somme } from '../../core/mois';
import { useStore } from '../../data/store';
import { Badge, Barre, Bouton, Carte, Ecran, Ligne, Texte, Vide } from '../../ui/kit';
import { c } from '../../ui/theme';

const dateFr = (j: string) => j.split('-').reverse().join('/');

export default function Epargne() {
  const { donnees: d } = useStore();
  const objectifs = d.objectifs.filter((o) => !o.archive);
  const sansObjectif = somme(d.transactions.filter((t) => t.type === 'epargne' && !t.objectifId));
  return (
    <Ecran>
      {objectifs.length === 0 ? (
        <Carte>
          <Vide titre="Pas encore d’objectif." texte="Vacances, voiture, coussin de sécurité ? Donnez un nom et un montant, puis rangez-y votre épargne chaque mois." />
        </Carte>
      ) : (
        objectifs.map((o) => {
          const fait = avancement(d, o.id);
          const atteint = fait >= o.montantVise;
          return (
            <Carte key={o.id} onPress={() => router.push({ pathname: '/objectif', params: { id: o.id } })} etiquette={`${o.nom}, ${euros(fait)} sur ${euros(o.montantVise)}`}>
              <Ligne entre>
                <Texte gras>{o.nom}</Texte>
                {atteint ? <Badge texte="Atteint" ton="ok" /> : null}
              </Ligne>
              <Texte doux>
                {euros(fait)} sur {euros(o.montantVise)}
                {o.dateVisee ? ` · pour le ${dateFr(o.dateVisee)}` : ''}
              </Texte>
              <Barre part={o.montantVise ? fait / o.montantVise : 0} couleur={atteint ? c.success : c.accent} fond={atteint ? c.successSoft : c.accentSoft} />
            </Carte>
          );
        })
      )}
      {sansObjectif ? <Texte doux>Épargne rangée sans objectif : {euros(sansObjectif)}</Texte> : null}
      <Bouton titre="Créer un objectif" onPress={() => router.push('/objectif')} />
      {objectifs.length ? <Bouton titre="Ranger de l’épargne" variante="secondaire" onPress={() => router.push({ pathname: '/ajouter', params: { type: 'epargne' } })} /> : null}
    </Ecran>
  );
}
