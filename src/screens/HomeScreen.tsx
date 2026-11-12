import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';

export function HomeScreen({ onCreate, onJoin }: { onCreate: (name: string) => Promise<void>; onJoin: (name: string, code: string) => Promise<void> }) {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestPermission = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    setPermission(result.granted);
  };
  useEffect(() => { void requestPermission(); }, []);
  const validName = name.trim().length > 0;
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); } catch { setError('Não foi possível concluir. Tente novamente.'); } finally { setBusy(false); } };
  if (permission === null) return <View style={styles.center}><ActivityIndicator size="large" color="#176b45" /></View>;
  if (!permission) return <View style={styles.center}><Text style={styles.title}>Precisamos da sua localização para jogar.</Text><Button label="Tentar novamente" onPress={() => void requestPermission()} /></View>;
  return <View style={styles.container}><Text style={styles.title}>Pega-Ladrão</Text><TextInput style={styles.input} placeholder="Seu nome" value={name} onChangeText={v => setName(v.slice(0, 20))} maxLength={20} autoCapitalize="words" /><TextInput style={styles.input} placeholder="Código da sala" value={code} onChangeText={v => setCode(v.toUpperCase().slice(0, 4))} maxLength={4} autoCapitalize="characters" />
    {!!error && <Text style={styles.error}>{error}</Text>}{busy && <ActivityIndicator color="#176b45" />}
    <Button label="Criar sala" disabled={!validName || busy} onPress={() => void run(() => onCreate(name.trim()))} />
    <Button label="Entrar na sala" disabled={!validName || busy} onPress={() => void run(() => onJoin(name.trim(), code.trim().toUpperCase()))} />
  </View>;
}
export function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: '#f5f7f5' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24, padding: 24 }, title: { fontSize: 28, fontWeight: '800', color: '#183326', textAlign: 'center', marginBottom: 16 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d6dfd8', borderRadius: 10, padding: 15, fontSize: 17 }, button: { backgroundColor: '#176b45', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 }, disabled: { opacity: 0.45 }, buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' }, error: { textAlign: 'center', color: '#b42318' } });
