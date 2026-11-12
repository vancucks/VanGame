import type { Timestamp } from 'firebase/firestore';

export type Team = 'police' | 'thief' | null;
export type PlayerStatus = 'free' | 'arrested';
export type RoomStatus = 'lobby' | 'started' | 'finished';
export interface Room { hostId: string; status: RoomStatus; startedAt: Timestamp | null; createdAt: Timestamp }
export interface Player { name: string; team: Team; thiefCode: string | null; status: PlayerStatus }
export interface PlayerWithId extends Player { uid: string }
export interface LocationRecord { lat: number; lng: number; updatedAtMs: number }
export interface ThiefSnapshot extends LocationRecord { uid: string; name: string }
export interface GameEvent { type: 'capture' | 'release'; targetName: string; byName: string | null; createdAt: Timestamp }
