import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Radar } from '../components/Radar';
import { captureThief, finishIfAllCaught, readThiefSnapshot } from '../roomService';
import type { PlayerWithId, ThiefSnapshot } from '../types';
import { Button } from './HomeScreen';

const PERIOD = 7 * 60 * 1000;
function format(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
export function PoliceScreen({ code, uid, players, startedAt }: { code: string; uid: string; players: PlayerWithId[]; startedAt: number }) {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ThiefSnapshot[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const playersRef = useRef(players);
  playersRef.current = players;
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    void Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 }, loc => setPosition(loc.coords)).then(s => { subscription = s; });
    return () => subscription?.remove();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    let timeout: ReturnType<typeof setTimeout>;
    const take = async () => { const next = await readThiefSnapshot(code, playersRef.current); setSnapshot(next); setUpdatedAt(Date.now()); };
    const first = startedAt + 60000;
    const schedule = () => {
      const delay = Math.max(0, first + Math.max(0, Math.ceil((Date.now() - first) / PERIOD)) * PERIOD - Date.now());
      timeout = setTimeout(() => { void take(); scheduleNext(); }, delay);
    };
    const scheduleNext = () => { timeout = setTimeout(() => { void take(); scheduleNext(); }, PERIOD); };
    schedule();
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [code, startedAt]);
  const freeThieves = players.filter(p => p.team === 'thief' && p.status === 'free');
  const shown = snapshot.filter(t => players.some(p => p.uid === t.uid && p.status === 'free'));
  const refresh = updatedAt === null ? Math.max(0, Math.ceil((startedAt + 60000 - now) / 1000)) : Math.max(0, Math.ceil((startedAt + 60000 + (Math.floor((now - startedAt - 60000) / PERIOD) + 1) * PERIOD - now) / 1000));
  const arrest = (target: PlayerWithId) => Alert.alert(`Prender ${target.name}?`, '', [
    { text: 'Não', style: 'cancel' }, { text: 'Sim', onPress: () => { setBusy(true); void captureThief(code, target.uid, target.name).then(async done => { if (!done) Alert.alert('Esse ladrão já está preso.'); else await finishIfAllCaught(code); }).catch(() => Alert.alert('Não foi possível prender o ladrão.')).finally(() => setBusy(false)); } },
  ]);
  const choose = () => {
    if (!freeThieves.length) { Alert.alert('Nenhum ladrão solto.'); return; }
    Alert.alert('Prender ladrão', undefined, [...freeThieves.map(p => ({ text: p.name, onPress: () => arrest(p) })), { text: 'Cancelar', style: 'cancel' as const }]);
  };
  return <ScrollView contentContainerStyle={styles.container}><Text style={styles.heading}>Radar</Text>{position ? <Radar police={{ lat: position.latitude, lng: position.longitude }} thieves={shown} /> : <Text style={styles.obtain}>Obtendo sua localização...</Text>}
    <Text style={styles.meta}>Atualizado às {updatedAt === null ? '--:--:--' : new Date(updatedAt).toLocaleTimeString('pt-BR')}</Text><Text style={styles.meta}>Próxima atualização em {format(refresh)}</Text><View style={styles.action}><Button label="Prender ladrão" disabled={busy} onPress={choose} /></View>
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { flexGrow: 1, padding: 16, backgroundColor: '#f5f7f5', gap: 8 }, heading: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#183326' }, obtain: { flex: 1, minHeight: 360, textAlign: 'center', textAlignVertical: 'center', fontSize: 17, color: '#52655a' }, meta: { textAlign: 'center', color: '#44564a' }, action: { marginTop: 4 } });
