// S11 Historique : épargné vs visé par mois, et les bilans passés.

import { router } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { bilanDe, euros, historique, libelleMois, type LigneHistorique } from '../../core/mois';
import { useStore } from '../../data/store';
import { Badge, Carte, Ecran, Ligne, SousTitre, Texte, Vide } from '../../ui/kit';
import { useMoisChoisi } from '../../ui/moisChoisi';
import { c, mise } from '../../ui/theme';

const court = (cle: string) => libelleMois(cle).slice(0, 3) + '.';

function Graphique({ lignes }: { lignes: LigneHistorique[] }) {
  const { width } = useWindowDimensions();
  const l = Math.min(width, mise.maxWidth) - 64;
  const h = 160;
  const donnees = [...lignes].reverse().slice(-6);
  const max = Math.max(1, ...donnees.flatMap((x) => [x.epargne, x.epargneVisee]));
  const pas = l / donnees.length;
  const largeur = Math.min(28, pas / 3);
  const y = (v: number) => h - 20 - (Math.max(0, v) / max) * (h - 30);
  return (
    <View accessible accessibilityLabel={donnees.map((x) => `${libelleMois(x.cle)} : épargné ${euros(x.epargne)} sur ${euros(x.epargneVisee)} visés`).join('. ')}>
      <Svg width={l} height={h}>
        <Line x1={0} x2={l} y1={h - 20} y2={h - 20} stroke={c.border} strokeWidth={1} />
        {donnees.map((x, i) => {
          const cx = pas * i + pas / 2;
          return (
            <G key={x.cle}>
              <Rect x={cx - largeur - 2} y={y(x.epargneVisee)} width={largeur} height={h - 20 - y(x.epargneVisee)} rx={4} fill={c.accentSoft} />
              <Rect x={cx + 2} y={y(x.epargne)} width={largeur} height={h - 20 - y(x.epargne)} rx={4} fill={x.epargne >= x.epargneVisee ? c.success : c.danger} />
              <SvgText x={cx} y={h - 4} fontSize={12} fill={c.textMuted} textAnchor="middle">
                {court(x.cle)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Ligne ecart={16}>
        <Ligne ecart={6}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accent }} />
          <Texte petit doux>Visé</Texte>
        </Ligne>
        <Ligne ecart={6}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.success }} />
          <Texte petit doux>Épargné (rouge : en dessous)</Texte>
        </Ligne>
      </Ligne>
    </View>
  );
}

export default function Historique() {
  const { donnees: d } = useStore();
  const { choisir } = useMoisChoisi();
  const lignes = historique(d);
  const total = lignes.reduce((s, x) => s + x.epargne, 0);
  return (
    <Ecran>
      {lignes.length < 2 ? (
        <Carte>
          <Vide titre="L’historique se remplit mois après mois." texte="Il apparaît après votre premier mois complet." />
        </Carte>
      ) : (
        <Carte>
          <SousTitre>Épargne des derniers mois</SousTitre>
          <Graphique lignes={lignes} />
          <Texte doux>Total épargné sur {lignes.length} mois : {euros(total)}</Texte>
        </Carte>
      )}
      {lignes.map((x) => {
        const b = bilanDe(d, x.cle);
        return (
          <Carte
            key={x.cle}
            onPress={() => {
              if (b || x.clos) router.push({ pathname: '/bilan', params: { mois: x.cle } });
              else {
                choisir(x.cle);
                router.push('/');
              }
            }}
          >
            <Ligne entre>
              <Texte gras>{libelleMois(x.cle)}</Texte>
              {x.clos ? <Badge texte="Clos" /> : <Badge texte="En cours" ton="attention" />}
            </Ligne>
            <Texte doux>
              Dépensé {euros(x.depense)} · épargné{' '}
              <Texte ton={x.epargne >= x.epargneVisee ? 'success' : 'danger'}>{euros(x.epargne)}</Texte> sur {euros(x.epargneVisee)} visés
            </Texte>
            {b?.aChanger ? <Texte petit doux>À changer : {b.aChanger}</Texte> : null}
          </Carte>
        );
      })}
    </Ecran>
  );
}
