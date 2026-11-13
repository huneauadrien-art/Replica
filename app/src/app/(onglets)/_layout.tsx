import { Text } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { couleurs } from '../../ui/kit';

const icone = (emoji: string) => () => <Text style={{ fontSize: 18, lineHeight: 22 }}>{emoji}</Text>;

export default function Onglets() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: couleurs.vigne,
        tabBarInactiveTintColor: couleurs.doux,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { minHeight: 60 },
        tabBarItemStyle: { paddingVertical: 4 },
        headerStyle: { backgroundColor: couleurs.fond },
        headerTitleStyle: { fontWeight: '800', color: couleurs.texte },
        sceneStyle: { backgroundColor: couleurs.fond },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('🏠') }} />
      <Tabs.Screen name="parcelles" options={{ title: 'Parcelles', tabBarIcon: icone('🍇') }} />
      <Tabs.Screen name="traitements" options={{ title: 'Traitements', tabBarIcon: icone('💧') }} />
      <Tabs.Screen name="stock" options={{ title: 'Stock', tabBarIcon: icone('📦') }} />
      <Tabs.Screen name="registre" options={{ title: 'Registre', tabBarIcon: icone('📋') }} />
    </Tabs>
  );
}
