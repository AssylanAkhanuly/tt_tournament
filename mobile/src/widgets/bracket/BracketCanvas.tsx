import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  Path,
  RoundedRect,
  Text,
  rect,
  rrect,
  useFont,
  useImage,
  type SkFont,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  layoutSingleElimination,
  roundTitle,
  type Bracket,
  type NodeBox,
} from '../../entities/bracket/model';

// бандл-шрифт: у CanvasKit (web) нет системных шрифтов, а на устройстве это даёт
// одинаковую типографику. Для прод — заменить на Inter (OFL).
const FONT = require('../../../assets/font.ttf');

const C = {
  card: '#151b2b',
  live: 'rgba(111,155,255,0.6)',
  border: 'rgba(255,255,255,0.09)',
  divider: 'rgba(255,255,255,0.06)',
  ink: '#eef2fb',
  mut: '#98a2b6',
  dim: '#5b6577',
  pri: '#6f9bff',
  ok: '#34d399',
  avatar: '#3b4675',
  conn: 'rgba(255,255,255,0.16)',
};

const clampW = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

type Fonts = { name: SkFont; score: SkFont };

// имена короткие («Фамилия И.»), но подстрахуемся от наезда на счёт
const trimName = (s: string) => (s.length > 16 ? s.slice(0, 15) + '…' : s);

// SVG-строки вместо SkPath.moveTo/lineTo (те помечены deprecated в skia 56)
function hline(x1: number, y: number, x2: number) {
  return `M${x1} ${y} L${x2} ${y}`;
}

function MatchNode({ n, f }: { n: NodeBox; f: Fonts }) {
  const m = n.match;
  const imgA = useImage(m.a?.avatarUrl ?? null);
  const imgB = useImage(m.b?.avatarUrl ?? null);
  const live = m.status === 'live';

  // фиксированная геометрия строк — гарантирует, что аватар/имя/счёт/разделитель
  // не пересекаются: строка A [y+10..y+32], разделитель y+34, строка B [y+36..y+58]
  const AV = 22;
  const avX = n.x + 13;
  const nameX = n.x + 43;
  const scoreX = n.x + n.w - 22;
  const divY = n.y + 34;

  const rows = [
    { side: m.a, img: imgA, win: m.winner === 'a', score: m.scoreA, cy: n.y + 21 },
    { side: m.b, img: imgB, win: m.winner === 'b', score: m.scoreB, cy: n.y + 47 },
  ];

  return (
    <Group>
      <RoundedRect x={n.x} y={n.y} width={n.w} height={n.h} r={14} color={C.card} />
      <RoundedRect
        x={n.x}
        y={n.y}
        width={n.w}
        height={n.h}
        r={14}
        color={live ? C.live : C.border}
        style="stroke"
        strokeWidth={live ? 1.4 : 1}
      />
      {/* live: зелёная полоса слева вместо бейджа поверх аватара — без наезда */}
      {live && (
        <RoundedRect x={n.x + 5} y={n.y + 13} width={3.5} height={n.h - 26} r={2} color={C.ok} />
      )}
      {rows.map((row, i) => {
        const avY = row.cy - AV / 2;
        return (
          <Group key={i}>
            {row.img ? (
              <Group clip={rrect(rect(avX, avY, AV, AV), AV / 2, AV / 2)}>
                <Image image={row.img} x={avX} y={avY} width={AV} height={AV} fit="cover" />
              </Group>
            ) : (
              <Circle cx={avX + AV / 2} cy={avY + AV / 2} r={AV / 2} color={C.avatar} />
            )}
            <Text
              x={nameX}
              y={row.cy + 4}
              text={row.side ? trimName(row.side.name) : '—'}
              font={f.name}
              color={row.side ? (row.win ? C.ink : C.mut) : C.dim}
            />
            {row.score != null && (
              <Text
                x={scoreX}
                y={row.cy + 4}
                text={String(row.score)}
                font={f.score}
                color={row.win ? C.pri : C.dim}
              />
            )}
          </Group>
        );
      })}
      <Path
        path={hline(n.x + 12, divY, n.x + n.w - 12)}
        style="stroke"
        strokeWidth={1}
        color={C.divider}
      />
    </Group>
  );
}

export function BracketCanvas({
  bracket,
  width,
  height,
}: {
  bracket: Bracket;
  width: number;
  height: number;
}) {
  const layout = useMemo(
    () => layoutSingleElimination(bracket, { nodeW: 196, nodeH: 68, gapX: 64, gapY: 20, padding: 24 }),
    [bracket],
  );
  const roundCount = useMemo(
    () => Math.max(...bracket.matches.map((m) => m.round)) + 1,
    [bracket],
  );

  const name = useFont(FONT, 13);
  const score = useFont(FONT, 13.5);
  const title = useFont(FONT, 10.5);

  const connPath = useMemo(() => {
    let d = '';
    for (const c of layout.connectors) {
      c.points.forEach((pt, i) => (d += `${i === 0 ? 'M' : 'L'}${pt.x} ${pt.y} `));
    }
    return d;
  }, [layout]);

  // жесты: пан + пинч → transform группы. Порядок трансформа — translate,
  // затем scale, поэтому масштаб идёт от начала координат; чтобы пинч
  // «тянул к пальцам», при зуме досчитываем translate так, чтобы точка под
  // фокусом жеста оставалась на месте (focal-point zoom).
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stx = useSharedValue(0);
  const sty = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // одним пальцем — панорама (maxPointers(1), чтобы не конфликтовать с пинчем)
  const pan = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((e) => {
      tx.value = stx.value + e.translationX;
      ty.value = sty.value + e.translationY;
    })
    .onEnd(() => {
      stx.value = tx.value;
      sty.value = ty.value;
    });

  // двумя пальцами — зум вокруг фокуса (+ перемещение фокуса = двупальцевая панорама)
  const pinch = Gesture.Pinch()
    .onBegin((e) => {
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const next = clampW(savedScale.value * e.scale, 0.5, 3);
      scale.value = next;
      // зум вокруг ЗАФИКСИРОВАННОГО (в onBegin) фокуса — точка под пальцами
      // держится на месте. Живой e.focalX НЕ используем: при отрыве пальцев
      // центроид скачет к оставшемуся касанию и сетку «дёргает».
      tx.value = focalX.value - ((focalX.value - stx.value) / savedScale.value) * next;
      ty.value = focalY.value - ((focalY.value - sty.value) / savedScale.value) * next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      stx.value = tx.value;
      sty.value = ty.value;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const transform = useDerivedValue(() => [
    { translateX: tx.value },
    { translateY: ty.value },
    { scale: scale.value },
  ]);

  // зум кнопками вокруг центра экрана — та же focal-математика, что в пинче.
  // Пинч на реальном устройстве работает; кнопки — надёжный способ и на эмуляторе.
  const zoomAround = (cx: number, cy: number, factor: number) => {
    const cur = scale.value;
    const next = Math.min(3, Math.max(0.5, cur * factor));
    const ntx = cx - ((cx - tx.value) / cur) * next;
    const nty = cy - ((cy - ty.value) / cur) * next;
    scale.value = withTiming(next, { duration: 160 });
    tx.value = withTiming(ntx, { duration: 160 });
    ty.value = withTiming(nty, { duration: 160 });
    savedScale.value = next;
    stx.value = ntx;
    sty.value = nty;
  };
  const zoomReset = () => {
    scale.value = withTiming(1, { duration: 160 });
    tx.value = withTiming(0, { duration: 160 });
    ty.value = withTiming(0, { duration: 160 });
    savedScale.value = 1;
    stx.value = 0;
    sty.value = 0;
  };

  if (!name || !score || !title) return null; // шрифт грузится
  const f: Fonts = { name, score };

  return (
    <View style={{ width, height }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={[StyleSheet.absoluteFill, { width, height }]}>
          <Group transform={transform}>
            <Path path={connPath} style="stroke" strokeWidth={1.5} color={C.conn} />
            {Array.from({ length: roundCount }).map((_, r) => {
              const first = layout.nodes.find((n) => n.match.round === r);
              if (!first) return null;
              return (
                <Text
                  key={'t' + r}
                  x={first.x}
                  y={14}
                  text={roundTitle(r, roundCount).toUpperCase()}
                  font={title}
                  color={C.dim}
                />
              );
            })}
            {layout.nodes.map((n) => (
              <MatchNode key={n.match.id} n={n} f={f} />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>
      <View style={styles.zoomBar} pointerEvents="box-none">
        <Pressable style={styles.zoomBtn} onPress={() => zoomAround(width / 2, height / 2, 1.35)}>
          <RNText style={styles.zoomSign}>+</RNText>
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={zoomReset}>
          <RNText style={styles.zoomReset}>1:1</RNText>
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={() => zoomAround(width / 2, height / 2, 1 / 1.35)}>
          <RNText style={styles.zoomSign}>−</RNText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zoomBar: { position: 'absolute', right: 14, bottom: 84, flexDirection: 'column', gap: 10 },
  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(21,27,43,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomSign: { color: '#eef2fb', fontSize: 26, lineHeight: 28, fontWeight: '500' },
  zoomReset: { color: '#98a2b6', fontSize: 12.5, fontWeight: '700' },
});
