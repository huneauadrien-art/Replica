// Confirmation et message, qui marchent aussi sur le web (Alert.alert n'y fait rien).

import { Alert, Platform } from 'react-native';

/** Confirmation qui marche aussi sur le web (Alert.alert n'y fait rien). */
export function confirmer(titre: string, message: string, action = 'Confirmer'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titre}\n\n${message}`));
  return new Promise((ok) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => ok(false) },
      { text: action, style: 'destructive', onPress: () => ok(true) },
    ]),
  );
}

export function informer(titre: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${titre}\n\n${message}`);
  else Alert.alert(titre, message);
}
