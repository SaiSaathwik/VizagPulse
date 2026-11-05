import { Issue } from '../types';
import { createCivicSceneSvg } from './imageCompressor';
import { computeDeterministicPriority } from './priority';

const STORAGE_KEY = 'vizagpulse_issues_v4';
const VOTED_PLUS_ONES_KEY = 'vizagpulse_plus_ones_v4';
const FIX_VOTES_KEY = 'vizagpulse_fix_votes_v4';

export function getInitialDemoIssues(): Issue[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const rawSampleIssues: Issue[] = [
    {
      id: 'vizag-001',
      type: 'Garbage',
      areaName: 'Dwaraka Nagar (RTC Complex Lane)',
      latitude: 17.7266,
      longitude: 83.3051,
      plusOnes: 14,
      status: 'open',
      createdAt: now - 1 * hour, // 1 hour ago
      fixYes: 0,
      fixNo: 0,
      priority: 6,
      priorityReason: 'Commercial packing overflow obstructing bus bay sidewalk.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Commercial Refuse Accumulation',
        category: 'Garbage',
        areaName: 'Dwaraka Nagar',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-002',
      type: 'Drain / Sewage',
      areaName: 'Madhurawada (Near IT SEZ Highway)',
      latitude: 17.8184,
      longitude: 83.3562,
      plusOnes: 29,
      status: 'open',
      createdAt: now - 2 * day, // 2 days ago
      fixYes: 0,
      fixNo: 0,
      priority: 8,
      priorityReason: 'Arterial culvert silt blockage with standing blackwater pool.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Silt-Choked Drainage Culvert',
        category: 'Drain / Sewage',
        areaName: 'Madhurawada',
        isAfter: false,
      }),
    },
    {
      // 100 metres from vizag-002 in Madhurawada to test Duplicate Detection!
      id: 'vizag-002b',
      type: 'Drain / Sewage',
      areaName: 'Madhurawada (IT SEZ Bus Shelter)',
      latitude: 17.8191,
      longitude: 83.3568,
      plusOnes: 18,
      status: 'open',
      createdAt: now - 3 * day,
      fixYes: 0,
      fixNo: 0,
      priority: 7,
      priorityReason: 'Adjacent storm gutter overflowing near bus waiting area.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Adjacent Storm Gutter Overflow',
        category: 'Drain / Sewage',
        areaName: 'Madhurawada',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-003',
      type: 'Streetlight',
      areaName: 'PM Palem (Cricket Stadium Road)',
      latitude: 17.7981,
      longitude: 83.3512,
      plusOnes: 22,
      status: 'open',
      createdAt: now - 4 * day, // 4 days ago
      fixYes: 0,
      fixNo: 0,
      priority: 6,
      priorityReason: 'Median high-mast lighting blackout causing sharp nighttime blind spot.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Median High-Mast Light Blackout',
        category: 'Streetlight',
        areaName: 'PM Palem',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-004',
      type: 'Other',
      customType: 'Open Utility Trench',
      areaName: 'Seethammadhara (North Extension)',
      latitude: 17.7421,
      longitude: 83.3129,
      plusOnes: 46,
      status: 'open',
      createdAt: now - 12 * day, // 12 days ago
      fixYes: 0,
      fixNo: 0,
      priority: 9,
      priorityReason: 'Unbarricaded 2-meter deep trench crossing busy residential intersection.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Unbarricaded Deep Pipe Trench',
        category: 'Other',
        areaName: 'Seethammadhara',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-005',
      type: 'Drain / Sewage',
      areaName: 'Maddilapalem (AU Bus Stop Arterial)',
      latitude: 17.7345,
      longitude: 83.3287,
      plusOnes: 19,
      status: 'open',
      createdAt: now - 3 * day, // 3 days ago
      fixYes: 0,
      fixNo: 0,
      priority: 7,
      priorityReason: 'Collapsed pedestrian drain slab exposing transit commuters to fall hazard.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Collapsed Drain Cover Slab',
        category: 'Drain / Sewage',
        areaName: 'Maddilapalem',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-006',
      type: 'Pothole',
      areaName: 'Rushikonda (Beach Drive Curve)',
      latitude: 17.7816,
      longitude: 83.3821,
      plusOnes: 38,
      status: 'fixed',
      createdAt: now - 7 * day, // 7 days ago
      fixedAt: now - 2 * day, // fixed 2 days ago
      fixYes: 24,
      fixNo: 1,
      priority: 8,
      priorityReason: 'Coastal highway crater successfully resurfaced with hot-mix bitumen.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Coastal Highway Asphalt Crater',
        category: 'Pothole',
        areaName: 'Rushikonda',
        isAfter: false,
      }),
      photoAfter: createCivicSceneSvg({
        title: 'Compacted Bituminous Surface Patch',
        category: 'Pothole',
        areaName: 'Rushikonda',
        isAfter: true,
      }),
    },
    {
      id: 'vizag-007',
      type: 'Water leak',
      areaName: 'MVP Colony (Sector 3 Main Avenue)',
      latitude: 17.7447,
      longitude: 83.3421,
      plusOnes: 31,
      status: 'fixed',
      createdAt: now - 11 * day, // 11 days ago
      fixedAt: now - 4 * day, // fixed 4 days ago
      fixYes: 21,
      fixNo: 2,
      priority: 8,
      priorityReason: 'High pressure drinking supply main sleeved and pressure-tested.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Pressurized Municipal Pipe Rupture',
        category: 'Water leak',
        areaName: 'MVP Colony',
        isAfter: false,
      }),
      photoAfter: createCivicSceneSvg({
        title: 'Excavated & Clamped Valve Chamber',
        category: 'Water leak',
        areaName: 'MVP Colony',
        isAfter: true,
      }),
    },
    {
      id: 'vizag-008',
      type: 'Pothole',
      areaName: 'Gajuwaka (Freight Industrial Corridor)',
      latitude: 17.6905,
      longitude: 83.2095,
      plusOnes: 52,
      status: 'fixed',
      createdAt: now - 9 * day, // 9 days ago
      fixedAt: now - 1 * day, // fixed 1 day ago
      fixYes: 5,
      fixNo: 14, // Disputed: fixNo > fixYes!
      priority: 9,
      priorityReason: 'Container truck impact trench flagged as disputed by local haulers.',
      isAiPriority: true,
      photoBefore: createCivicSceneSvg({
        title: 'Heavy Freight Corridor Crater',
        category: 'Pothole',
        areaName: 'Gajuwaka',
        isAfter: false,
      }),
      photoAfter: createCivicSceneSvg({
        title: 'Superficial Loose Gravel Dumping',
        category: 'Pothole',
        areaName: 'Gajuwaka',
        isAfter: true,
      }),
    },
  ];

  return rawSampleIssues.map((issue) => {
    if (!issue.priority) {
      const det = computeDeterministicPriority(issue);
      return { ...issue, priority: det.priority, priorityReason: det.reason };
    }
    return issue;
  });
}

export function loadIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDemoIssues();
      saveIssues(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure every issue has a priority score
      return parsed.map((item: Issue) => {
        if (!item.priority) {
          const det = computeDeterministicPriority(item);
          return { ...item, priority: det.priority, priorityReason: det.reason };
        }
        return item;
      });
    }
  } catch (err) {
    console.error('Failed to load issues from localStorage:', err);
  }
  const fallback = getInitialDemoIssues();
  saveIssues(fallback);
  return fallback;
}

export function saveIssues(issues: Issue[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    return true;
  } catch (err: any) {
    console.error('Failed to save issues to localStorage:', err);
    // Handle QuotaExceededError by pruning older photos if needed
    return false;
  }
}

export function resetDemoData(): Issue[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VOTED_PLUS_ONES_KEY);
    localStorage.removeItem(FIX_VOTES_KEY);
  } catch (err) {
    console.error('Failed to reset demo data:', err);
  }
  const fresh = getInitialDemoIssues();
  saveIssues(fresh);
  return fresh;
}

export function getVotedPlusOnes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(VOTED_PLUS_ONES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveVotedPlusOnes(voted: Record<string, boolean>): void {
  try {
    localStorage.setItem(VOTED_PLUS_ONES_KEY, JSON.stringify(voted));
  } catch {}
}

export function getFixVotes(): Record<string, 'yes' | 'no'> {
  try {
    const raw = localStorage.getItem(FIX_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFixVotes(votes: Record<string, 'yes' | 'no'>): void {
  try {
    localStorage.setItem(FIX_VOTES_KEY, JSON.stringify(votes));
  } catch {}
}

export function isIssueDisputed(issue: Issue): boolean {
  return issue.status === 'fixed' && issue.fixNo > issue.fixYes;
}
