import { Link } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, Text, type ColorValue } from 'react-native';
import { c } from '../../ui/theme';

const icone = (symbole: string) =>
  function Icone({ color }: { color: ColorValue }) {
    return <Text style={{ fontSize: 20, lineHeight: 24, color, fontWeight: '700' }}>{symbole}</Text>;
  };

function BoutonReglages() {
  return (
    <Link href="/reglages" asChild>
      <Pressable accessibilityRole="button" accessibilityLabel="Réglages" style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
        <Text style={{ fontSize: 22, color: c.accent }}>⚙</Text>
      </Pressable>
    </Link>
  );
}

export default function Onglets() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { minHeight: 60, backgroundColor: c.surface, borderTopColor: c.border },
        tabBarItemStyle: { paddingVertical: 4 },
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { fontWeight: '800', color: c.text },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.bg },
        headerRight: () => <BoutonReglages />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Mois', tabBarIcon: icone('◷') }} />
      <Tabs.Screen name="depenses" options={{ title: 'Dépenses', tabBarIcon: icone('≡') }} />
      <Tabs.Screen name="epargne" options={{ title: 'Épargne', tabBarIcon: icone('◎') }} />
      <Tabs.Screen name="historique" options={{ title: 'Historique', tabBarIcon: icone('▥') }} />
    </Tabs>
  );
}
