import {
  collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, runTransaction,
  serverTimestamp, setDoc, updateDoc, writeBatch, where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { GameEvent, LocationRecord, Player, PlayerWithId, Room, ThiefSnapshot, Team } from './types';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const roomRef = (code: string) => doc(db, 'rooms', code);
const playersRef = (code: string) => collection(db, 'rooms', code, 'players');
const eventRef = (code: string) => collection(db, 'rooms', code, 'events');
function roomCode() { return Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join(''); }
function thiefPin(used: Set<string>) { let pin = ''; do { pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0'); } while (used.has(pin)); used.add(pin); return pin; }

export async function createRoom(uid: string, name: string) {
  let code = roomCode();
  while ((await getDoc(roomRef(code))).exists()) code = roomCode();
  const batch = writeBatch(db);
  batch.set(roomRef(code), { hostId: uid, status: 'lobby', startedAt: null, createdAt: serverTimestamp() });
  batch.set(doc(playersRef(code), uid), { name, team: null, thiefCode: null, status: 'free' });
  await batch.commit();
  return code;
}
export async function joinRoom(code: string, uid: string, name: string) {
  const ref = roomRef(code);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return 'missing' as const;
  if ((snapshot.data() as Room).status !== 'lobby') return 'started' as const;
  await setDoc(doc(playersRef(code), uid), { name, team: null, thiefCode: null, status: 'free' });
  return 'joined' as const;
}
export async function chooseTeam(code: string, uid: string, team: Exclude<Team, null>) {
  await updateDoc(doc(playersRef(code), uid), { team });
}
export async function startRoom(code: string) {
  const snapshots = await getDocs(playersRef(code));
  const players = snapshots.docs.map(item => ({ ref: item.ref, data: item.data() as Player }));
  if (!players.length || players.some(p => !p.data.team) || !players.some(p => p.data.team === 'police') || !players.some(p => p.data.team === 'thief')) return false;
  const used = new Set<string>();
  const batch = writeBatch(db);
  players.filter(p => p.data.team === 'thief').forEach(p => batch.update(p.ref, { thiefCode: thiefPin(used) }));
  batch.update(roomRef(code), { status: 'started', startedAt: serverTimestamp() });
  await batch.commit();
  return true;
}
export async function captureThief(code: string, uid: string, name: string) {
  const targetRef = doc(playersRef(code), uid);
  return runTransaction(db, async tx => {
    const target = await tx.get(targetRef);
    if (!target.exists() || target.data().status !== 'free') return false;
    tx.update(targetRef, { status: 'arrested' });
    tx.set(doc(eventRef(code)), { type: 'capture', targetName: name, byName: null, createdAt: serverTimestamp() });
    return true;
  });
}
export async function releaseThief(code: string, uid: string, targetName: string, byName: string) {
  const targetRef = doc(playersRef(code), uid);
  return runTransaction(db, async tx => {
    const target = await tx.get(targetRef);
    if (!target.exists() || target.data().status !== 'arrested') return false;
    tx.update(targetRef, { status: 'free' });
    tx.set(doc(eventRef(code)), { type: 'release', targetName, byName, createdAt: serverTimestamp() });
    return true;
  });
}
export async function finishIfAllCaught(code: string) {
  const free = await getDocs(query(playersRef(code), where('team', '==', 'thief'), where('status', '==', 'free')));
  if (free.empty) await updateDoc(roomRef(code), { status: 'finished' });
}
export async function writeLocation(code: string, uid: string, location: LocationRecord) {
  await setDoc(doc(db, 'rooms', code, 'locations', uid), location);
}
export async function readThiefSnapshot(code: string, players: PlayerWithId[]): Promise<ThiefSnapshot[]> {
  const locations = await getDocs(collection(db, 'rooms', code, 'locations'));
  const byUid = new Map(players.filter(p => p.team === 'thief' && p.status === 'free').map(p => [p.uid, p]));
  return locations.docs.flatMap(item => {
    const player = byUid.get(item.id);
    if (!player) return [];
    return [{ uid: item.id, name: player.name, ...(item.data() as LocationRecord) }];
  });
}
export function listenRoom(code: string, callback: (room: Room | null) => void) {
  return onSnapshot(roomRef(code), snap => callback(snap.exists() ? snap.data() as Room : null));
}
export function listenPlayers(code: string, callback: (players: PlayerWithId[]) => void) {
  return onSnapshot(playersRef(code), snap => callback(snap.docs.map(item => ({ uid: item.id, ...(item.data() as Player) }))));
}
export function listenEvents(code: string, callback: (changes: GameEvent[]) => void) {
  const q = query(eventRef(code), orderBy('createdAt'));
  let initial = true;
  return onSnapshot(q, snap => {
    if (initial) { initial = false; return; }
    callback(snap.docChanges().filter(change => change.type === 'added').map(change => change.doc.data() as GameEvent));
  });
}
