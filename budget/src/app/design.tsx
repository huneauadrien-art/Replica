// Vitrine des composants, tous les états (contrôle du design system).

import { useState } from 'react';
import { View } from 'react-native';
import { GROUPES } from '../core/types';
import { Alerte, Badge, Barre, Bascule, Bouton, Carte, CarteChiffre, Champ, EnTeteJour, Etiquette, Jauge, Ligne, LigneTransaction, PastilleGroupe, PaveMontant, Puce, SelecteurMois, SousTitre, Texte, Titre, Vide, Ecran, useToast } from '../ui/kit';
import { c } from '../ui/theme';

export default function Design() {
  const [texte, setTexte] = useState('23,4');
  const [type, setType] = useState<'a' | 'b' | 'c'>('a');
  const toast = useToast();
  return (
    <Ecran>
      <Titre>Titre xl</Titre>
      <SousTitre>Sous-titre lg</SousTitre>
      <Texte>Texte de base · <Texte doux>doux</Texte> · <Texte ton="danger">danger</Texte> · <Texte ton="success">succès</Texte></Texte>
      <Etiquette>Étiquette</Etiquette>
      <SousTitre>Boutons</SousTitre>
      <Bouton titre="Principal" onPress={() => {}} />
      <Bouton titre="Principal grand" grand onPress={() => {}} />
      <Bouton titre="Secondaire" variante="secondaire" onPress={() => {}} />
      <Bouton titre="Discret" variante="discret" onPress={() => {}} />
      <Bouton titre="Danger" variante="danger" onPress={() => {}} />
      <Bouton titre="Désactivé" desactive onPress={() => {}} />
      <Bouton titre="Montrer un toast" variante="secondaire" onPress={() => toast({ texte: 'Courses 23,40 € ajoutée', annuler: () => {} })} />
      <SousTitre>Chiffres</SousTitre>
      <CarteChiffre libelle="Reste à dépenser" montant={41250} sousLigne="sur 1 320 € disponibles" />
      <CarteChiffre libelle="Attention" montant={8000} ton="attention" petit />
      <CarteChiffre libelle="Dépassé" montant={-2300} ton="depasse" petit sousLigne="Dépassé de 23 €" />
      <SousTitre>Jauges</SousTitre>
      <Carte>
        <Jauge groupe="survie" depense={32000} budget={50000} />
        <Jauge groupe="optionnel" depense={9500} budget={10000} />
        <Jauge groupe="culture" depense={6000} budget={5000} />
        <Jauge groupe="extra" depense={1200} />
      </Carte>
      <Barre part={0.4} />
      <SousTitre>Sélecteurs</SousTitre>
      <Bascule options={[{ valeur: 'a', titre: 'Dépense' }, { valeur: 'b', titre: 'Revenu' }, { valeur: 'c', titre: 'Épargne' }]} valeur={type} onChange={setType} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GROUPES.map((g, i) => (
          <PastilleGroupe key={g} groupe={g} grande aide="aide" choisi={i === 0} onPress={() => {}} />
        ))}
      </View>
      <Ligne>
        {GROUPES.map((g, i) => (
          <PastilleGroupe key={g} groupe={g} choisi={i === 1} onPress={() => {}} />
        ))}
      </Ligne>
      <Ligne>
        <Puce titre="Active" actif onPress={() => {}} />
        <Puce titre="Inactive" actif={false} onPress={() => {}} />
      </Ligne>
      <SelecteurMois libelle="Novembre 2026" precedent={() => {}} badge="Clos" />
      <SousTitre>Saisie</SousTitre>
      <Champ label="Champ" placeholder="exemple" />
      <Champ label="Champ en erreur" value="abc" erreur="Montant non reconnu" />
      <Champ label="Zone de réflexion" multiline />
      <Texte gras>{texte || '0'} €</Texte>
      <PaveMontant texte={texte} onChange={setTexte} />
      <SousTitre>Listes</SousTitre>
      <EnTeteJour jour="Mardi 10 novembre" total={5340} />
      <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
        <LigneTransaction titre="Marché" sousTitre="Courses" montant={2340} sens="depense" groupe="survie" />
        <LigneTransaction titre="Prime" sousTitre="Revenu" montant={15000} sens="revenu" />
        <LigneTransaction titre="Vacances" sousTitre="Épargne" montant={10000} sens="epargne" />
      </View>
      <Ligne>
        <Badge texte="Neutre" />
        <Badge texte="OK" ton="ok" />
        <Badge texte="Attention" ton="attention" />
        <Badge texte="Danger" ton="danger" />
      </Ligne>
      <Alerte texte="Alerte attention" />
      <Alerte ton="danger" texte="Alerte danger" />
      <Alerte ton="ok" texte="Alerte ok" />
      <Carte>
        <Vide titre="État vide" texte="Une phrase courte.">
          <Bouton titre="Action" onPress={() => {}} />
        </Vide>
      </Carte>
    </Ecran>
  );
}
