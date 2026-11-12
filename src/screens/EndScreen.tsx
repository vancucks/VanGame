import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './HomeScreen';

export function EndScreen({ onHome }: { onHome: () => void }) { return <View style={styles.container}><Text style={styles.text}>Fim de jogo! Todos os ladrões foram presos.</Text><Button label="Voltar ao início" onPress={onHome} /></View>; }
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 24, gap: 28, backgroundColor: '#f5f7f5' }, text: { textAlign: 'center', fontSize: 27, fontWeight: '800', color: '#183326' } });
