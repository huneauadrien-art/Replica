// Facture en cours de création, en attendant qu'on l'enregistre (elle n'est pas encore dans les données).

import type { FactureAchat } from '../core/types';

export type Brouillon = { facture: FactureAchat; message?: string };

export const brouillons = new Map<string, Brouillon>();
