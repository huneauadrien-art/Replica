import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { cultureDe } from '../../core/cultures';
import { controlerTraitement, dateRecolteMin, fmt, rentreePossible, stockActuel } from '../../core/registre';
import type { Traitement } from '../../core/types';
import { aujourdhui, maintenant, nouvelId, remplacer, useStore } from '../../data/store';
import { Bouton, Carte, Champ, ChampNombre, confirmer, Ecran, Ligne, lireNombre, ListeAlertes, Puce, SousTitre, Texte, versTexte } from '../../ui/kit';

export default function FicheTraitement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees: d, modifier } = useStore();
  const existant = d.traitements.find((t) => t.id === id);
  const nouveau = id === 'nouveau';
  // Pour un nouveau traitement, on reprend l'opérateur et le matériel du dernier.
  const dernier = useMemo(() => [...d.traitements].sort((a, b) => b.date.localeCompare(a.date))[0], [d.traitements]);

  const [date, setDate] = useState(existant?.date ?? aujourdhui());
  const [heureDebut, setHeureDebut] = useState(existant?.heureDebut ?? (nouveau ? maintenant() : ''));
  const [heureFin, setHeureFin] = useState(existant?.heureFin ?? '');
  const [surfaces, setSurfaces] = useState<Record<string, string>>(
    Object.fromEntries((existant?.parcelles ?? []).map((p) => [p.parcelleId, versTexte(p.surfaceHa)])),
  );
  const [doses, setDoses] = useState<Record<string, string>>(
    Object.fromEntries((existant?.produits ?? []).map((p) => [p.produitId, versTexte(p.doseHa)])),
  );
  const [operateur, setOperateur] = useState(existant?.operateur ?? dernier?.operateur ?? '');
  const [materiel, setMateriel] = useState(existant?.materiel ?? dernier?.materiel ?? '');
  const [cible, setCible] = useState(existant?.cible ?? '');
  const [stade, setStade] = useState(existant?.stadeBBCH ?? '');
  const [bouillie, setBouillie] = useState(versTexte(existant?.volumeBouillieHa));
  const [vent, setVent] = useState(versTexte(existant?.ventKmh));
  const [temperature, setTemperature] = useState(versTexte(existant?.temperatureC));
  const [notes, setNotes] = useState(existant?.notes ?? '');
  const [tenter, setTenter] = useState(false);
  // Filtre des parcelles par culture : la vigne d'office, car c'est elle qu'on traite le plus.
  const [filtreCulture, setFiltreCulture] = useState<string | null>(() =>
    d.parcelles.some((p) => !p.archivee && cultureDe(p) === 'Vigne') ? 'Vigne' : null,
  );

  if (!existant && !nouveau) return <Ecran><Texte>Traitement introuvable.</Texte></Ecran>;

  const toutes = d.parcelles.filter((p) => !p.archivee || p.id in surfaces);
  const culturesPresentes = [...new Set(toutes.map(cultureDe))].sort((a, b) => (a === 'Vigne' ? -1 : b === 'Vigne' ? 1 : a.localeCompare(b, 'fr')));
  const parcelles = toutes
    .filter((p) => filtreCulture == null || cultureDe(p) === filtreCulture || p.id in surfaces)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true }));
  const produits = d.produits.filter((p) => !p.archive || p.id in doses).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  const brouillon: Traitement = {
    id: existant?.id ?? 'brouillon',
    date: date.trim(),
    heureDebut: heureDebut.trim() || undefined,
    heureFin: heureFin.trim() || undefined,
    parcelles: Object.entries(surfaces).map(([parcelleId, s]) => ({ parcelleId, surfaceHa: lireNombre(s) ?? 0 })),
    produits: Object.entries(doses).map(([produitId, s]) => ({ produitId, doseHa: lireNombre(s) ?? 0 })),
    operateur: operateur.trim(),
    materiel: materiel.trim() || undefined,
    cible: cible.trim() || undefined,
    stadeBBCH: stade.trim() || undefined,
    volumeBouillieHa: lireNombre(bouillie),
    ventKmh: lireNombre(vent),
    temperatureC: lireNombre(temperature),
    notes: notes.trim() || undefined,
  };
  const alertes = controlerTraitement(d, brouillon);
  const surfaceTotale = brouillon.parcelles.reduce((s, p) => s + p.surfaceHa, 0);

  const basculerParcelle = (pid: string, surfaceHa: number) =>
    setSurfaces((s) => {
      const n = { ...s };
      if (pid in n) delete n[pid];
      else n[pid] = versTexte(surfaceHa);
      return n;
    });
  const basculerProduit = (pid: string) =>
    setDoses((s) => {
      const n = { ...s };
      if (pid in n) delete n[pid];
      else n[pid] = '';
      return n;
    });

  const enregistrer = async () => {
    setTenter(true);
    if (alertes.some((a) => a.niveau === 'bloquant')) return;
    const graves = alertes.filter((a) => a.niveau === 'danger');
    if (graves.length && !(await confirmer('Enregistrer quand même ?', graves.map((a) => a.message).join('\n'), 'Enregistrer'))) return;
    const t = { ...brouillon, id: existant?.id ?? nouvelId() };
    modifier((x) => ({ ...x, traitements: remplacer(x.traitements, t) }));
    router.back();
  };

  const supprimer = async () => {
    if (!existant) return;
    if (await confirmer('Supprimer ce traitement ?', 'Il sera retiré du registre et les produits seront remis en stock.', 'Supprimer')) {
      modifier((x) => ({ ...x, traitements: x.traitements.filter((t) => t.id !== existant.id) }));
      router.back();
    }
  };

  const recolte = existant ? dateRecolteMin(d, existant) : null;

  return (
    <Ecran>
      <Stack.Screen options={{ title: nouveau ? 'Nouveau traitement' : `Traitement du ${existant!.date}` }} />

      {existant && (
        <Carte>
          {recolte && <Texte>Récolte possible à partir du {recolte}</Texte>}
          <Texte>Rentrée dans la parcelle à partir du {rentreePossible(d, existant)}</Texte>
        </Carte>
      )}

      <Champ label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} />
      <Ligne>
        <View style={{ flex: 1 }}>
          <Champ label="Début (HH:MM)" value={heureDebut} onChangeText={setHeureDebut} placeholder="06:30" />
        </View>
        <View style={{ flex: 1 }}>
          <Champ label="Fin (HH:MM)" value={heureFin} onChangeText={setHeureFin} placeholder="09:00" />
        </View>
      </Ligne>

      <SousTitre>Parcelles</SousTitre>
      {toutes.length === 0 && <Texte doux>Ajoutez d'abord vos parcelles (onglet Parcelles).</Texte>}
      {culturesPresentes.length > 1 && (
        <Ligne>
          <Texte doux>Afficher :</Texte>
          {culturesPresentes.map((c) => (
            <Puce key={c} titre={c} actif={filtreCulture === c} onPress={() => setFiltreCulture(c)} />
          ))}
          <Puce titre="Toutes" actif={filtreCulture == null} onPress={() => setFiltreCulture(null)} />
        </Ligne>
      )}
      <Ligne>
        {parcelles.map((p) => (
          <Puce key={p.id} titre={p.nom} actif={p.id in surfaces} onPress={() => basculerParcelle(p.id, p.surfaceHa)} />
        ))}
      </Ligne>
      {parcelles.length > 1 && (
        <Bouton
          titre={Object.keys(surfaces).length === parcelles.length ? 'Tout décocher' : `Toutes les parcelles${filtreCulture ? ` (${filtreCulture.toLowerCase()})` : ''}`}
          variante="secondaire"
          onPress={() =>
            setSurfaces(Object.keys(surfaces).length === parcelles.length ? {} : Object.fromEntries(parcelles.map((p) => [p.id, versTexte(p.surfaceHa)])))
          }
        />
      )}
      {Object.keys(surfaces).map((pid) => {
        const p = d.parcelles.find((x) => x.id === pid);
        return (
          <ChampNombre
            key={pid}
            label={`${p?.nom ?? '?'} : surface traitée (ha)`}
            valeur={surfaces[pid]}
            onChange={(v) => setSurfaces((s) => ({ ...s, [pid]: v }))}
            aide={p ? `Parcelle : ${fmt(p.surfaceHa)} ha` : undefined}
          />
        );
      })}
      {surfaceTotale > 0 && <Texte gras>Surface traitée : {fmt(surfaceTotale)} ha</Texte>}

      <SousTitre>Produits</SousTitre>
      {produits.length === 0 && <Texte doux>Ajoutez d'abord vos produits (onglet Stock).</Texte>}
      <Ligne>
        {produits.map((p) => (
          <Puce key={p.id} titre={p.nom} actif={p.id in doses} onPress={() => basculerProduit(p.id)} />
        ))}
      </Ligne>
      {Object.keys(doses).map((pid) => {
        const p = d.produits.find((x) => x.id === pid);
        if (!p) return null;
        const dose = lireNombre(doses[pid]) ?? 0;
        const quantite = dose * surfaceTotale;
        const reste = stockActuel(d, pid, existant?.id) - quantite;
        return (
          <Carte key={pid}>
            <ChampNombre
              label={`${p.nom} : dose (${p.unite}/ha)`}
              valeur={doses[pid]}
              onChange={(v) => setDoses((s) => ({ ...s, [pid]: v }))}
              placeholder={p.doseMaxHa != null ? `max ${versTexte(p.doseMaxHa)}` : undefined}
            />
            <Texte doux>
              Quantité : {fmt(quantite)} {p.unite} · reste en stock : {fmt(reste)} {p.unite}
            </Texte>
          </Carte>
        );
      })}

      <SousTitre>Détails</SousTitre>
      <Champ label="Opérateur" value={operateur} onChangeText={setOperateur} />
      <Champ label="Matériel" value={materiel} onChangeText={setMateriel} placeholder="Pulvérisateur" />
      <Champ label="Cible" value={cible} onChangeText={setCible} placeholder="Mildiou, oïdium…" />
      <Ligne>
        <View style={{ flex: 1 }}>
          <Champ label="Stade BBCH" value={stade} onChangeText={setStade} placeholder="57" keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre label="Bouillie (L/ha)" valeur={bouillie} onChange={setBouillie} />
        </View>
      </Ligne>
      <Ligne>
        <View style={{ flex: 1 }}>
          <ChampNombre label="Vent (km/h)" valeur={vent} onChange={setVent} />
        </View>
        <View style={{ flex: 1 }}>
          <ChampNombre label="Température (°C)" valeur={temperature} onChange={setTemperature} />
        </View>
      </Ligne>
      <Champ label="Notes" value={notes} onChangeText={setNotes} multiline />

      <ListeAlertes alertes={tenter ? alertes : alertes.filter((a) => a.niveau !== 'bloquant')} />
      <Bouton titre="Enregistrer" onPress={enregistrer} />
      {existant && <Bouton titre="Supprimer" variante="danger" onPress={supprimer} />}
    </Ecran>
  );
}
