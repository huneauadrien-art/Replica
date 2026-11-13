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
      <StatusBar style="light" />
      <Stack screenOptions={{ ...optionsCave, headerBackTitle: 'Retour' }}>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Ma cave' }} />
        <Stack.Screen name="nouveau" options={{ title: 'Nouvelle bouteille' }} />
        <Stack.Screen name="vin/[id]" options={{ title: '' }} />
        <Stack.Screen name="modifier/[id]" options={{ title: 'Modifier le vin' }} />
        <Stack.Screen name="ranger" options={{ title: 'Ranger' }} />
        <Stack.Screen name="deguster/[id]" options={{ title: 'Déguster' }} />
        <Stack.Screen name="plan" options={{ title: 'Plan de cave' }} />
        <Stack.Screen name="meubles" options={{ title: 'Mes meubles' }} />
        <Stack.Screen name="carnet" options={{ title: 'Carnet de dégustation' }} />
        <Stack.Screen name="reglages" options={{ title: 'Réglages' }} />
      </Stack>
    </StoreProvider>
  );
}
