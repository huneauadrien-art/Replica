import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { bornesMois, jourLocal, moisDe, reglages } from '../core/mois';
import { lireRappels, planifier } from '../data/rappels';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from '../data/store';
import { FournisseurToast } from '../ui/kit';
import { FournisseurMois } from '../ui/moisChoisi';
import { c } from '../ui/theme';

/** Replanifie les rappels à chaque démarrage (le rappel de bilan suit la fin du mois de budget). */
function Rappels() {
  const { donnees, pret } = useStore();
  const debut = reglages(donnees).jourDebutMois;
  useEffect(() => {
    if (!pret) return;
    const fin = bornesMois(moisDe(jourLocal(), debut), debut).au;
    lireRappels()
      .then((r) => planifier(r, fin))
      .catch(() => {});
  }, [pret, debut]);
  return null;
}

export default function Racine() {
  return (
    <StoreProvider>
      <FournisseurMois>
        <FournisseurToast>
          <Rappels />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerTintColor: c.accent,
              headerStyle: { backgroundColor: c.bg },
              headerTitleStyle: { fontWeight: '700', color: c.text },
              contentStyle: { backgroundColor: c.bg },
              headerBackTitle: 'Retour',
            }}
          >
            <Stack.Screen name="(onglets)" options={{ headerShown: false }} />
            <Stack.Screen name="ajouter" options={{ title: 'Ajouter', presentation: 'modal' }} />
            <Stack.Screen name="preparer" options={{ title: 'Préparer le mois' }} />
            <Stack.Screen name="bilan" options={{ title: 'Bilan du mois' }} />
            <Stack.Screen name="objectif" options={{ title: 'Objectif d’épargne' }} />
            <Stack.Screen name="reglages" options={{ title: 'Réglages' }} />
            <Stack.Screen name="categories" options={{ title: 'Catégories' }} />
            <Stack.Screen name="recurrentes" options={{ title: 'Revenus et charges fixes' }} />
            <Stack.Screen name="nas" options={{ title: 'Serveur NAS' }} />
            <Stack.Screen name="design" options={{ title: 'Composants' }} />
          </Stack>
        </FournisseurToast>
      </FournisseurMois>
    </StoreProvider>
  );
}
