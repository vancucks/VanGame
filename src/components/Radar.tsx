import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { chooseRange, radarPoint, relativePosition, type Coordinate } from '../geo';
import type { ThiefSnapshot } from '../types';

export function Radar({ police, thieves }: { police: Coordinate; thieves: ThiefSnapshot[] }) {
  const { width } = useWindowDimensions();
  const size = width - 32, c = size / 2, r = c;
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => { const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })); loop.start(); return () => loop.stop(); }, [rotation]);
  const positioned = useMemo(() => thieves.map(t => ({ ...t, ...relativePosition(t, police) })), [thieves, police]);
  const range = chooseRange(positioned.map(t => t.distance));
  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const label = (val: number) => Math.round(val);
  return <View style={[styles.wrap, { width: size, height: size }]}><Svg width={size} height={size}>
    {[1/3, 2/3, 1].map((fraction, i) => <React.Fragment key={i}><Circle cx={c} cy={c} r={r * fraction} stroke="#00FF00" strokeWidth={1.5} fill="none"/><SvgText x={c + 5} y={c - r * fraction + 13} fill="#00FF00" fontSize="10">{label(range * fraction)} m</SvgText></React.Fragment>)}
    <Line x1={c} y1={c-r} x2={c} y2={c+r} stroke="#00FF00" strokeOpacity="0.4"/><Line x1={c-r} y1={c} x2={c+r} y2={c} stroke="#00FF00" strokeOpacity="0.4"/>
    <SvgText x={c-4} y={15} fill="#00FF00" fontSize="12">N</SvgText><SvgText x={c-4} y={size-5} fill="#00FF00" fontSize="12">S</SvgText><SvgText x={size-15} y={c+4} fill="#00FF00" fontSize="12">L</SvgText><SvgText x={5} y={c+4} fill="#00FF00" fontSize="12">O</SvgText>
    <Polygon points={`${c},${c-9} ${c-7},${c+7} ${c+7},${c+7}`} fill="#2F6BFF"/>
    {positioned.map(t => { const p = radarPoint(t.dx, t.dy, t.distance, range, c, c, r); return <React.Fragment key={t.uid}><Circle cx={p.x} cy={p.y} r={6} fill="#FF3B30"/><SvgText x={p.x+9} y={p.y+4} fill="#fff" fontSize="12">{t.name}</SvgText></React.Fragment>; })}
  </Svg><Animated.View pointerEvents="none" style={[styles.sweepPivot, { left: c, top: c, transform: [{ rotate: spin }] }]}><View style={[styles.sweep, { width: r }]} /></Animated.View>{!thieves.length && <View pointerEvents="none" style={styles.empty}><Text style={styles.emptyText}>Nenhum ladrão no radar.</Text></View>}</View>;
}
const styles = StyleSheet.create({ wrap: { backgroundColor: '#000', alignSelf: 'center', position: 'relative' }, sweepPivot: { position: 'absolute', width: 0, height: 0 }, sweep: { position: 'absolute', left: 0, top: -0.75, height: 1.5, backgroundColor: '#00ff00' }, empty: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }, emptyText: { color: '#fff', backgroundColor: '#0009', padding: 5 } });
