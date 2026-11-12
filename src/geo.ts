export interface Coordinate { lat: number; lng: number }
export interface RadarPoint { x: number; y: number; distance: number }
export const EARTH_RADIUS_METERS = 6371000;
export const RADAR_RANGES = [100, 250, 500, 1000, 2000] as const;
export function relativePosition(thief: Coordinate, police: Coordinate) {
  const dLat = (thief.lat - police.lat) * Math.PI / 180;
  const dLng = (thief.lng - police.lng) * Math.PI / 180;
  const dy = EARTH_RADIUS_METERS * dLat;
  const dx = EARTH_RADIUS_METERS * dLng * Math.cos(police.lat * Math.PI / 180);
  return { dx, dy, distance: Math.sqrt(dx * dx + dy * dy) };
}
export function chooseRange(distances: number[]) {
  if (!distances.length) return 100;
  const max = Math.max(...distances);
  return RADAR_RANGES.find(range => range >= max) ?? 2000;
}
export function radarPoint(dx: number, dy: number, distance: number, range: number, cx: number, cy: number, radius: number): RadarPoint {
  const scale = distance > range && distance > 0 ? range / distance : 1;
  return { x: cx + dx * scale / range * radius, y: cy - dy * scale / range * radius, distance };
}
