import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, View } from 'react-native';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { auth } from './src/firebase';
import { AlertModal } from './src/components/AlertModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { CountdownScreen } from './src/screens/CountdownScreen';
import { PoliceScreen } from './src/screens/PoliceScreen';
import { ThiefScreen } from './src/screens/ThiefScreen';
import { EndScreen } from './src/screens/EndScreen';
import { chooseTeam, createRoom, joinRoom, listenEvents, listenPlayers, listenRoom, startRoom, writeLocation } from './src/roomService';
import type { GameEvent, PlayerWithId, Room } from './src/types';

export default function App() {
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [phase, setPhase] = useState<'countdown' | 'game'>('countdown');
  const [alerts, setAlerts] = useState<GameEvent[]>([]);
  const playerRef = useRef<PlayerWithId | undefined>(undefined);
  playerRef.current = players.find(item => item.uid === uid);
  const myTeam = playerRef.current?.team;

  useEffect(() => onAuthStateChanged(auth, async user => {
    try {
      const identity = user ?? (await signInAnonymously(auth)).user;
      setUid(identity.uid);
    } catch { Alert.alert('Não foi possível iniciar o app', 'Verifique a configuração do Firebase e tente novamente.'); }
    finally { setAuthReady(true); }
  }), []);

  useEffect(() => {
    if (!code) { setRoom(null); setPlayers([]); return; }
    const unsubs: Unsubscribe[] = [listenRoom(code, setRoom), listenPlayers(code, setPlayers), listenEvents(code, events => setAlerts(q => [...q, ...events]))];
    return () => unsubs.forEach(unsub => unsub());
  }, [code]);

  useEffect(() => {
    if (room?.status === 'started') setPhase('countdown');
  }, [room?.status]);

  useEffect(() => {
    if (!code || room?.status !== 'started' || playerRef.current?.team !== 'thief') return;
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    void Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 15000, distanceInterval: 0 }, location => {
      if (uid) void writeLocation(code, uid, { lat: location.coords.latitude, lng: location.coords.longitude, updatedAtMs: Date.now() });
    }).then(value => { if (cancelled) value.remove(); else subscription = value; });
    return () => { cancelled = true; subscription?.remove(); };
  }, [code, uid, room?.status, myTeam]);

  const goHome = useCallback(() => { setCode(null); setRoom(null); setPlayers([]); setAlerts([]); setPhase('countdown'); }, []);
  const completeCountdown = useCallback(() => setPhase('game'), []);
  const create = useCallback(async (name: string) => {
    if (!uid) return;
    const newCode = await createRoom(uid, name);
    setCode(newCode);
  }, [uid]);
  const join = useCallback(async (name: string, inputCode: string) => {
    if (!uid) return;
    const result = await joinRoom(inputCode, uid, name);
    if (result === 'missing') { Alert.alert('Sala não encontrada.'); return; }
    if (result === 'started') { Alert.alert('A partida já começou.'); return; }
    setCode(inputCode);
  }, [uid]);

  const activeRoom = !!code && !!room && room.status !== 'finished';
  useEffect(() => {
    if (!activeRoom) return;
    void activateKeepAwakeAsync('pega-ladrao-room');
    return () => { void deactivateKeepAwake('pega-ladrao-room'); };
  }, [activeRoom]);

  if (!authReady || !uid) return <View style={styles.loading}><ActivityIndicator size="large" color="#176b45" /></View>;
  let content;
  if (!code || !room) {
    content = <HomeScreen onCreate={create} onJoin={join} />;
  } else if (room.status === 'finished') {
    content = <EndScreen onHome={goHome} />;
  } else if (room.status === 'lobby') {
    content = <LobbyScreen code={code} uid={uid} hostId={room.hostId} players={players} onTeam={team => void chooseTeam(code, uid, team)} onStart={() => void startRoom(code)} />;
  } else {
    const player = players.find(item => item.uid === uid);
    const startedAt = room.startedAt?.toMillis();
    if (!player || !startedAt) content = <View style={styles.loading}><ActivityIndicator size="large" color="#176b45" /></View>;
    else if (phase === 'countdown') content = <CountdownScreen team={player.team} startedAt={startedAt} onDone={completeCountdown} />;
    else if (player.team === 'police') content = <PoliceScreen code={code} uid={uid} players={players} startedAt={startedAt} />;
    else content = <ThiefScreen code={code} uid={uid} players={players} />;
  }
  const activeAlert = alerts[0] ?? null;
  return <View style={styles.root}><StatusBar barStyle="dark-content" />{content}<AlertModal event={activeAlert} onClose={() => setAlerts(items => items.slice(1))} /></View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7f5' } });
