import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './HomeScreen';
import type { PlayerWithId, Team } from '../types';

const teamName = (team: Team) => team === 'police' ? 'Policial' : team === 'thief' ? 'Ladrão' : 'Sem time';
export function LobbyScreen({ code, uid, hostId, players, onTeam, onStart }: { code: string; uid: string; hostId: string; players: PlayerWithId[]; onTeam: (team: Exclude<Team, null>) => void; onStart: () => void }) {
  const ready = players.length > 0 && players.every(p => p.team) && players.some(p => p.team === 'police') && players.some(p => p.team === 'thief');
  const me = players.find(p => p.uid === uid);
  return <ScrollView contentContainerStyle={styles.container}><Text style={styles.heading}>Código da sala</Text><Text style={styles.code}>{code}</Text><View style={styles.row}><View style={styles.flex}><Button label={me?.team === 'police' ? '✓ Sou Policial' : 'Sou Policial'} onPress={() => onTeam('police')} /></View><View style={styles.flex}><Button label={me?.team === 'thief' ? '✓ Sou Ladrão' : 'Sou Ladrão'} onPress={() => onTeam('thief')} /></View></View>
    <Text style={styles.section}>Jogadores</Text>{players.map(p => <View key={p.uid} style={styles.player}><Text style={styles.playerName}>{p.name}</Text><Text style={styles.team}>{teamName(p.team)}</Text></View>)}
    {hostId === uid ? <Button label="Iniciar" disabled={!ready} onPress={onStart} /> : <Text style={styles.wait}>Aguardando o criador iniciar a partida.</Text>}
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { flexGrow: 1, padding: 22, gap: 12, backgroundColor: '#f5f7f5' }, heading: { fontSize: 16, textAlign: 'center', color: '#44564a' }, code: { fontSize: 44, fontWeight: '900', letterSpacing: 8, textAlign: 'center', color: '#176b45' }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 }, section: { fontWeight: '800', fontSize: 20, marginTop: 18, color: '#183326' }, player: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: '#dce4de', borderBottomWidth: 1 }, playerName: { fontSize: 17 }, team: { color: '#52655a' }, wait: { textAlign: 'center', padding: 15, color: '#52655a' } });
