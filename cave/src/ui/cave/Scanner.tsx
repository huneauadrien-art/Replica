// Lecture du code-barres d'une bouteille : caméra, ou saisie des chiffres à la main.

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normaliserEan } from '../../core/reconnaissance';
import { BoutonCave, ChampCave, Surtitre, T } from './kit';
import { c, police } from './theme';

export function Scanner({ visible, onCode, onFermer }: { visible: boolean; onCode: (ean: string) => void; onFermer: () => void }) {
  const [permission, demander] = useCameraPermissions();
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const deja = useRef(false);
  const marges = useSafeAreaInsets();

  const valider = (brut: string) => {
    const ean = normaliserEan(brut);
    if (!ean) return setErreur('Ce code ne semble pas complet : 8, 12 ou 13 chiffres, sous les barres.');
    deja.current = true;
    setErreur(null);
    setSaisie('');
    onCode(ean);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFermer} onShow={() => (deja.current = false)}>
      <View style={{ flex: 1, backgroundColor: c.fond, paddingTop: marges.top + 16, paddingBottom: marges.bottom + 16, paddingHorizontal: 16, gap: 16 }}>
        <Surtitre>Code-barres</Surtitre>
        <T.texte doux>Visez le code-barres de la contre-étiquette. Il est lu tout seul.</T.texte>
        <View style={{ flex: 1, minHeight: 220, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.bord2, backgroundColor: c.fondProfond, justifyContent: 'center' }}>
          {permission?.granted ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={(r) => {
                if (!deja.current && normaliserEan(r.data)) valider(r.data);
              }}
            />
          ) : (
            <View style={{ padding: 20, gap: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: police.sans, fontSize: 15, color: c.texte2, textAlign: 'center' }}>
                {permission && !permission.canAskAgain
                  ? "L'appli n'a pas accès à l'appareil photo : autorisez-le dans les réglages du téléphone, ou tapez les chiffres ci-dessous."
                  : "Pour lire le code-barres, l'appli a besoin de l'appareil photo."}
              </Text>
              {!permission || permission.canAskAgain ? <BoutonCave titre="Autoriser l'appareil photo" variante="creme" onPress={() => void demander()} /> : null}
            </View>
          )}
        </View>
        <ChampCave label="OU TAPEZ LES CHIFFRES" value={saisie} onChangeText={setSaisie} keyboardType="number-pad" placeholder="3 760…" maxLength={20} onSubmitEditing={() => valider(saisie)} />
        {erreur ? <Text style={{ fontFamily: police.sans, color: c.rougeTexte, fontSize: 14 }}>{erreur}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <BoutonCave titre="Fermer" variante="fantome" style={{ flex: 1 }} onPress={onFermer} />
          <BoutonCave titre="Chercher" variante="creme" style={{ flex: 1 }} desactive={!saisie.trim()} onPress={() => valider(saisie)} />
        </View>
      </View>
    </Modal>
  );
}
