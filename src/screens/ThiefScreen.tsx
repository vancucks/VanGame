import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { releaseThief } from '../roomService';
import type { PlayerWithId } from '../types';
import { Button } from './HomeScreen';

export function ThiefScreen({ code, uid, players }: { code: string; uid: string; players: PlayerWithId[] }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const me = players.find(p => p.uid === uid);
  const arrested = me?.status === 'arrested';
  const release = async () => {
    const target = players.find(p => p.team === 'thief' && p.thiefCode === pin && p.status === 'arrested');
    if (!target) { Alert.alert('Código inválido ou ladrão não está preso.'); return; }
    setBusy(true);
    try { const success = await releaseThief(code, target.uid, target.name, me?.name ?? ''); if (!success) Alert.alert('Código inválido ou ladrão não está preso.'); else { setOpen(false); setPin(''); } }
    catch { Alert.alert('Não foi possível soltar o preso.'); } finally { setBusy(false); }
  };
  return <View style={styles.container}><Text style={styles.heading}>Você é ladrão</Text><Text style={styles.status}>{arrested ? 'Você está preso' : 'Você está solto'}</Text>
    {arrested ? <><Text style={styles.label}>Seu código:</Text><Text style={styles.pin}>{me?.thiefCode ?? '----'}</Text><Text style={styles.note}>Mostre este código para um ladrão solto.</Text></> : <>
      <Button label="Soltar preso" onPress={() => setOpen(true)} />{open && <View style={styles.form}><TextInput style={styles.input} keyboardType="number-pad" maxLength={4} value={pin} onChangeText={v => setPin(v.replace(/\D/g, '').slice(0, 4))} placeholder="Código do preso" /><Button label="Soltar" disabled={pin.length !== 4 || busy} onPress={() => void release()} /></View>}
    </>}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 24, gap: 18, backgroundColor: '#f5f7f5' }, heading: { textAlign: 'center', fontSize: 28, fontWeight: '800', color: '#183326' }, status: { textAlign: 'center', fontSize: 20, color: '#176b45' }, label: { textAlign: 'center', fontSize: 21, fontWeight: '700' }, pin: { textAlign: 'center', fontSize: 52, fontWeight: '900', letterSpacing: 10, color: '#176b45' }, note: { textAlign: 'center', fontSize: 17 }, form: { gap: 12 }, input: { backgroundColor: '#fff', borderColor: '#d6dfd8', borderWidth: 1, padding: 15, fontSize: 22, textAlign: 'center', borderRadius: 10 } });
