import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../data/store';
import { FournisseurToast } from '../ui/kit';
import { FournisseurMois } from '../ui/moisChoisi';
import { c } from '../ui/theme';

export default function Racine() {
  return (
    <StoreProvider>
      <FournisseurMois>
        <FournisseurToast>
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
