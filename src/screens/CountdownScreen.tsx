import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Team } from '../types';

const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
export function CountdownScreen({ team, startedAt, onDone }: { team: Team; startedAt: number; onDone: () => void }) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil((startedAt + 60000 - Date.now()) / 1000)));
  const completed = useRef(false);
  useEffect(() => {
    const update = () => { const value = Math.max(0, Math.ceil((startedAt + 60000 - Date.now()) / 1000)); setLeft(value); if (!value && !completed.current) { completed.current = true; onDone(); } };
    update(); const timer = setInterval(update, 250); return () => clearInterval(timer);
  }, [startedAt, onDone]);
  return <View style={styles.container}><Text style={styles.text}>{team === 'thief' ? 'Corra e se esconda!' : 'Aguarde na delegacia.'}</Text><Text style={styles.time}>{format(left)}</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28, padding: 24, backgroundColor: '#f5f7f5' }, text: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: '#183326' }, time: { fontSize: 64, fontWeight: '900', color: '#176b45', fontVariant: ['tabular-nums'] } });
