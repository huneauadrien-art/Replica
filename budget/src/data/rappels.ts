// Rappels du téléphone (notifications locales, sans serveur) : le soir pour noter les
// dépenses, et le dernier jour du mois de budget pour faire le bilan.
// Réglages propres à chaque téléphone, jamais synchronisés.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ReglagesRappels = { soir: boolean; heure: number; bilan: boolean };
export const RAPPELS_DEFAUT: ReglagesRappels = { soir: false, heure: 21, bilan: false };
const CLE = 'budget-foyer/rappels';
const CANAL = 'rappels';

export const rappelsDisponibles = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function lireRappels(): Promise<ReglagesRappels> {
  try {
    return { ...RAPPELS_DEFAUT, ...JSON.parse((await AsyncStorage.getItem(CLE)) ?? '{}') };
  } catch {
    return RAPPELS_DEFAUT;
  }
}

/** Demande l'autorisation si besoin ; false si l'utilisateur refuse. */
export async function autoriser(): Promise<boolean> {
  const actuel = await Notifications.getPermissionsAsync();
  if (actuel.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Remplace tous les rappels prévus par ceux des réglages.
 * `finDuMois` : dernier jour du mois de budget courant, 'AAAA-MM-JJ'.
 */
export async function planifier(r: ReglagesRappels, finDuMois: string): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(r));
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!r.soir && !r.bilan) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CANAL, { name: 'Rappels', importance: Notifications.AndroidImportance.DEFAULT });
  if (r.soir)
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Les dépenses du jour', body: 'Une minute pour noter ce que vous avez dépensé aujourd’hui.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.heure, minute: 0, channelId: CANAL },
    });
  if (r.bilan) {
    const [a, m, j] = finDuMois.split('-').map(Number);
    const quand = new Date(a, m - 1, j, 20, 0, 0);
    if (quand.getTime() > Date.now())
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Le bilan du mois', body: 'Le mois se termine : deux minutes pour faire le point et préparer le suivant.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quand, channelId: CANAL },
      });
  }
}
