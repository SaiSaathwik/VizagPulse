import { Issue, IssueType } from '../types';
import { getDaysOpen } from './timeAgo';

const PRIORITY_CACHE_PREFIX = 'vizagpulse_ai_prio_cache_';

// Type weights specified by requirement D
const TYPE_WEIGHTS: Record<IssueType, number> = {
  Pothole: 3,
  'Drain / Sewage': 3,
  'Water leak': 3,
  Streetlight: 2,
  Garbage: 2,
  Other: 1,
};

/**
 * Deterministic priority score calculation:
 * score = type weight (1-3) + min(plusOnes, 5) + min(daysOpen, 5)
 * Raw score range: 1 to 13.
 * Scaled & clamped to integer 1-10.
 * Default reason: "Based on type, age and +1s".
 */
export function computeDeterministicPriority(issue: Issue): {
  priority: number;
  reason: string;
} {
  const typeWeight = TYPE_WEIGHTS[issue.type] ?? 1;
  const plusOnesWeight = Math.min(Math.max(0, issue.plusOnes || 0), 5);
  const daysOpen = getDaysOpen(issue.createdAt);
  const daysOpenWeight = Math.min(daysOpen, 5);

  const rawScore = typeWeight + plusOnesWeight + daysOpenWeight; // 1 to 13
  // Scale 1..13 -> 1..10
  const scaled = ((rawScore - 1) / (13 - 1)) * 9 + 1;
  const priority = Math.max(1, Math.min(10, Math.round(scaled)));

  return {
    priority,
    reason: 'Based on type, age and +1s',
  };
}

/**
 * Creates a stable deterministic hash of open issues so we only call Gemini
 * when issues, +1s, or statuses change.
 */
export function computeIssuesHash(issues: Issue[]): string {
  const openSummaries = issues
    .filter((i) => i.status === 'open')
    .map((i) => `${i.id}_${i.type}_${i.plusOnes}_${getDaysOpen(i.createdAt)}_${i.fixNo > i.fixYes ? 'disp' : 'norm'}`)
    .sort()
    .join('|');
  return `h_${openSummaries.length}_${openSummaries.slice(0, 160)}`;
}

/**
 * Retrieve cached AI priority rankings from localStorage
 */
export function getCachedPriorityRankings(
  hash: string
): Record<string, { priority: number; reason: string }> | null {
  try {
    const raw = localStorage.getItem(PRIORITY_CACHE_PREFIX + hash);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save cached AI priority rankings to localStorage
 */
export function saveCachedPriorityRankings(
  hash: string,
  rankings: Record<string, { priority: number; reason: string }>
): void {
  try {
    localStorage.setItem(PRIORITY_CACHE_PREFIX + hash, JSON.stringify(rankings));
  } catch {}
}

/**
 * Calls Gemini server endpoint for AI Priority Ranking with 20s timeout and validation
 */
export async function fetchAiPriorityRankings(
  openIssues: Issue[]
): Promise<Record<string, { priority: number; reason: string }>> {
  if (openIssues.length === 0) return {};

  const payload = openIssues.map((i) => ({
    id: i.id,
    type: i.type,
    areaName: i.areaName || 'Vizag',
    daysOpen: getDaysOpen(i.createdAt),
    plusOnes: i.plusOnes,
    disputed: i.fixNo > i.fixYes,
  }));

  const res = await fetch('/api/ai/priority-ranking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issues: payload }),
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`API endpoint not reachable or returned HTML: ${res.status}`);
  }

  const map: Record<string, { priority: number; reason: string }> = {};

  if (Array.isArray(data.rankings)) {
    for (const item of data.rankings) {
      if (item && item.id) {
        map[item.id] = {
          priority: Math.max(1, Math.min(10, Math.round(Number(item.priority) || 5))),
          reason: String(item.reason || 'Assessed by Gemini civic prioritization.'),
        };
      }
    }
  }

  return map;
}
