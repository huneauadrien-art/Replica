// Créer ou modifier un objectif d'épargne.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { avancement, euros, jourLocal, lireMontant, versChamp } from '../core/mois';
import type { ObjectifEpargne } from '../core/types';
import { nouvelId, remplacer, useStore } from '../data/store';
import { Alerte, Bouton, Champ, ChampMontant, confirmer, Ecran, Texte } from '../ui/kit';

function lireDate(t: string): string | undefined {
  const m = t.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? jourLocal(d) : undefined;
}

export default function Objectif() {
  const { donnees: d, modifier } = useStore();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existant = id ? d.objectifs.find((o) => o.id === id) : undefined;
  const [nom, setNom] = useState(existant?.nom ?? '');
  const [montant, setMontant] = useState(versChamp(existant?.montantVise));
  const [date, setDate] = useState(existant?.dateVisee ? existant.dateVisee.split('-').reverse().join('/') : '');
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = () => {
    const m = lireMontant(montant);
    if (!nom.trim()) return setErreur('Donnez un nom à l’objectif.');
    if (!m) return setErreur('Indiquez le montant visé.');
    if (date.trim() && !lireDate(date)) return setErreur('Date non reconnue (jj/mm/aaaa).');
    const o: ObjectifEpargne = { id: existant?.id ?? nouvelId(), nom: nom.trim(), montantVise: m, ...(date.trim() ? { dateVisee: lireDate(date) } : {}) };
    modifier((x) => ({ ...x, objectifs: remplacer(x.objectifs, o) }));
    router.back();
  };

  const archiver = async () => {
    if (!existant) return;
    const deja = avancement(d, existant.id);
    if (!(await confirmer('Retirer cet objectif ?', deja ? `Les ${euros(deja)} déjà rangés restent dans l’historique.` : 'Il disparaîtra de la liste.', 'Retirer'))) return;
    modifier((x) => ({ ...x, objectifs: x.objectifs.map((o) => (o.id === existant.id ? { ...o, archive: true } : o)) }));
    router.back();
  };

  return (
    <Ecran>
      <Champ label="Nom" value={nom} onChangeText={setNom} placeholder="Vacances d’été" />
      <ChampMontant label="Montant visé (€)" value={montant} onChangeText={setMontant} />
      <Champ label="Pour quand ? (facultatif, jj/mm/aaaa)" value={date} onChangeText={setDate} />
      {(() => {
        const m = lireMontant(montant);
        const j = lireDate(date);
        if (!m || !j) return null;
        const [a, mo] = j.split('-').map(Number);
        const auj = new Date();
        const moisRestants = Math.max(1, (a - auj.getFullYear()) * 12 + (mo - 1 - auj.getMonth()));
        const reste = Math.max(0, m - (existant ? avancement(d, existant.id) : 0));
        return <Texte doux>Soit environ {euros(Math.ceil(reste / moisRestants / 100) * 100)} par mois pendant {moisRestants} mois.</Texte>;
      })()}
      {erreur ? <Alerte ton="danger" texte={erreur} /> : null}
      <Bouton titre="Enregistrer" grand onPress={enregistrer} />
      {existant ? <Bouton titre="Ranger de l’épargne ici" variante="secondaire" onPress={() => router.push({ pathname: '/ajouter', params: { type: 'epargne', objectif: existant.id } })} /> : null}
      {existant ? <Bouton titre="Retirer l’objectif" variante="danger" onPress={archiver} /> : null}
    </Ecran>
  );
}
