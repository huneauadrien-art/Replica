import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../data/store';
import { couleurs } from '../ui/kit';

export default function Racine() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: couleurs.vigne,
          headerStyle: { backgroundColor: couleurs.fond },
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: couleurs.fond },
          headerBackTitle: 'Retour',
        }}
      >
        <Stack.Screen name="(onglets)" options={{ headerShown: false }} />
        <Stack.Screen name="import" options={{ title: 'Importer le fichier PAC' }} />
        <Stack.Screen name="parcelle/[id]" options={{ title: 'Parcelle' }} />
        <Stack.Screen name="produit/[id]" options={{ title: 'Produit' }} />
        <Stack.Screen name="traitement/[id]" options={{ title: 'Traitement' }} />
      </Stack>
    </StoreProvider>
  );
}
