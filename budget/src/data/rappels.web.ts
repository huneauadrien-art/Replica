// Version web : pas de rappels (le navigateur ne peut pas réveiller la page à heure fixe).

export type ReglagesRappels = { soir: boolean; heure: number; bilan: boolean };
export const RAPPELS_DEFAUT: ReglagesRappels = { soir: false, heure: 21, bilan: false };
export const rappelsDisponibles = false;
export const lireRappels = async (): Promise<ReglagesRappels> => RAPPELS_DEFAUT;
export const autoriser = async () => false;
export const planifier = async (_r: ReglagesRappels, _fin: string) => {};
