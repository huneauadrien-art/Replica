import { HankenGrotesk_400Regular } from '@expo-google-fonts/hanken-grotesk/400Regular';
import { HankenGrotesk_500Medium } from '@expo-google-fonts/hanken-grotesk/500Medium';
import { HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk/600SemiBold';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk/700Bold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { Spectral_400Regular } from '@expo-google-fonts/spectral/400Regular';
import { Spectral_400Regular_Italic } from '@expo-google-fonts/spectral/400Regular_Italic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../data/store';
import { optionsCave } from '../ui/cave/outils';
import { couleurs } from '../ui/kit';

export default function Racine() {
  // Polices de la cave. En cas d'échec, l'app s'affiche avec celles du système.
  const [chargees, erreur] = useFonts({
    Spectral_400Regular,
    Spectral_400Regular_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    JetBrainsMono_500Medium,
  });
  if (!chargees && !erreur) return null;
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
        <Stack.Screen name="reglages" options={{ title: 'Serveur NAS' }} />
        <Stack.Screen name="factures/index" options={{ title: "Factures d'achat" }} />
        <Stack.Screen name="factures/[id]" options={{ title: 'Facture' }} />
        <Stack.Screen name="factures/couts" options={{ title: 'Coûts par parcelle' }} />
        <Stack.Screen name="factures/export" options={{ title: 'Export comptable' }} />
        <Stack.Screen name="cave/nouveau" options={{ ...optionsCave, title: 'Nouvelle bouteille' }} />
        <Stack.Screen name="cave/vin/[id]" options={{ ...optionsCave, title: '' }} />
        <Stack.Screen name="cave/modifier/[id]" options={{ ...optionsCave, title: 'Modifier le vin' }} />
        <Stack.Screen name="cave/ranger" options={{ ...optionsCave, title: 'Ranger' }} />
        <Stack.Screen name="cave/deguster/[id]" options={{ ...optionsCave, title: 'Déguster' }} />
        <Stack.Screen name="cave/plan" options={{ ...optionsCave, title: 'Plan de cave' }} />
        <Stack.Screen name="cave/meubles" options={{ ...optionsCave, title: 'Mes meubles' }} />
        <Stack.Screen name="cave/carnet" options={{ ...optionsCave, title: 'Carnet de dégustation' }} />
      </Stack>
    </StoreProvider>
  );
}
