import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GameEvent } from '../types';

export function AlertModal({ event, onClose }: { event: GameEvent | null; onClose: () => void }) {
  const message = event?.type === 'capture' ? `${event.targetName} foi preso!` : event ? `${event.targetName} foi solto por ${event.byName}!` : '';
  return <Modal visible={!!event} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.card}><Text style={styles.message}>{message}</Text><Pressable style={styles.button} onPress={onClose}><Text style={styles.buttonText}>OK</Text></Pressable></View></View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 20 }, message: { fontSize: 20, textAlign: 'center', color: '#17201c' }, button: { backgroundColor: '#166b45', borderRadius: 10, padding: 14, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 } });
