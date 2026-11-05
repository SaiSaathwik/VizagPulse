import { Issue } from '../types';

/**
 * Calculates the great-circle distance between two geographic coordinates
 * in metres using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in metres
}

/**
 * Checks for existing OPEN issues of the same type within 150 metres.
 */
export function findNearbyDuplicateIssue(
  existingIssues: Issue[],
  newIssueType: string,
  userLat: number | null,
  userLng: number | null,
  thresholdMetres = 150
): { issue: Issue; distanceMetres: number } | null {
  if (userLat === null || userLng === null) return null;

  const openSameType = existingIssues.filter(
    (i) => i.status === 'open' && i.type === newIssueType && i.latitude !== null && i.longitude !== null
  );

  let closest: { issue: Issue; distanceMetres: number } | null = null;

  for (const item of openSameType) {
    const dist = calculateHaversineDistance(
      userLat,
      userLng,
      item.latitude!,
      item.longitude!
    );

    if (dist <= thresholdMetres) {
      if (!closest || dist < closest.distanceMetres) {
        closest = { issue: item, distanceMetres: Math.round(dist) };
      }
    }
  }

  return closest;
}
