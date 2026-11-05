import { Issue } from '../types';
import { createCivicSceneSvg } from './imageCompressor';

const STORAGE_KEY = 'vizagpulse_issues_v3';
const VOTED_PLUS_ONES_KEY = 'vizagpulse_plus_ones_v3';
const FIX_VOTES_KEY = 'vizagpulse_fix_votes_v3';

export function getInitialDemoIssues(): Issue[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  return [
    {
      id: 'vizag-001',
      type: 'Garbage',
      areaName: 'Dwaraka Nagar',
      latitude: 17.7266,
      longitude: 83.3051,
      plusOnes: 14,
      status: 'open',
      createdAt: now - 1 * hour, // 1 hour ago
      fixYes: 0,
      fixNo: 0,
      aiSeverity: 7,
      aiReason: 'Uncontained commercial organic refuse blocking pedestrian footpath and storm grates.',
      aiSituation: 'Large volume of mixed cardboard boxes, commercial packing crates, and rotting food waste dumped directly across the sidewalk. The overflow spills onto the active roadway curbing vehicular lanes and attracting stray cattle.',
      aiHazard: 'Pedestrians forced into heavy traffic lane; rotting organic runoff risks slipping and water contamination.',
      aiDepartment: 'Public Health & Sanitation Division',
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
      areaName: 'Madhurawada',
      latitude: 17.8184,
      longitude: 83.3562,
      plusOnes: 29,
      status: 'open',
      createdAt: now - 2 * day, // 2 days ago
      fixYes: 0,
      fixNo: 0,
      aiSeverity: 8,
      aiReason: 'Primary arterial stormwater canal choked with construction silt causing blackwater backup.',
      aiSituation: 'Severe silt and concrete waste blockage in the municipal culvert running adjacent to the IT SEZ corridor. Dark effluent has breached the masonry sidewalls and pooled into a 40-meter standing stagnation pool.',
      aiHazard: 'Vector-borne illness risk from stagnant blackwater and acute localized flash flooding during downpours.',
      aiDepartment: 'Water Supply & Sewerage Board',
      photoBefore: createCivicSceneSvg({
        title: 'Silt-Choked Drainage Culvert',
        category: 'Drain / Sewage',
        areaName: 'Madhurawada',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-003',
      type: 'Drain / Sewage',
      areaName: 'Maddilapalem',
      latitude: 17.7345,
      longitude: 83.3287,
      plusOnes: 19,
      status: 'open',
      createdAt: now - 3 * day, // 3 days ago
      fixYes: 0,
      fixNo: 0,
      aiSeverity: 5,
      aiReason: 'Broken concrete drain slab exposing subterranean runoff channel near city transit stop.',
      aiSituation: 'The reinforced concrete drain slab covering the storm sewer has sheared under bus tire loads. The resulting 1.2-meter hole exposes fast-flowing greywater right next to the college bus boarding point.',
      aiHazard: 'Severe trip and fall danger for commuters boarding buses, particularly during twilight hours.',
      aiDepartment: 'Roads & Bridges Department',
      photoBefore: createCivicSceneSvg({
        title: 'Collapsed Drain Cover Slab',
        category: 'Drain / Sewage',
        areaName: 'Maddilapalem',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-004',
      type: 'Streetlight',
      areaName: 'PM Palem',
      latitude: 17.7981,
      longitude: 83.3512,
      plusOnes: 22,
      status: 'open',
      createdAt: now - 4 * day, // 4 days ago
      fixYes: 0,
      fixNo: 0,
      aiSeverity: 6,
      aiReason: 'Complete power conduit failure across 4 consecutive high-mast streetlamp fixtures.',
      aiSituation: 'Four central median lighting poles spanning 200 meters near the cricket stadium are completely dark. A dangling subterranean wire junction appears cut or vandalized at the base of the second mast.',
      aiHazard: 'Zero visibility for high-speed two-wheelers and pedestrians crossing near the stadium junction.',
      aiDepartment: 'Electrical & Street Lighting Wing',
      photoBefore: createCivicSceneSvg({
        title: 'Median High-Mast Light Blackout',
        category: 'Streetlight',
        areaName: 'PM Palem',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-005',
      type: 'Other',
      customType: 'Open Utility Trench',
      areaName: 'Seethammadhara',
      latitude: 17.7421,
      longitude: 83.3129,
      plusOnes: 46,
      status: 'open',
      createdAt: now - 12 * day, // 12 days ago
      fixYes: 0,
      fixNo: 0,
      aiSeverity: 9,
      aiReason: 'Deep trench excavated across residential intersection left unbarricaded for almost two weeks.',
      aiSituation: 'A 2-meter deep by 15-meter long utility excavation crosses the primary residential collector road without reflective barricades, tape, or warning flashers. Earth embankments on both sides are starting to erode.',
      aiHazard: 'Catastrophic vehicle plunge risk and pedestrian fall hazard into jagged concrete rubble.',
      aiDepartment: 'Town Planning & Municipal Engineering',
      photoBefore: createCivicSceneSvg({
        title: 'Unbarricaded Deep Pipe Trench',
        category: 'Other',
        areaName: 'Seethammadhara',
        isAfter: false,
      }),
    },
    {
      id: 'vizag-006',
      type: 'Pothole',
      areaName: 'Rushikonda',
      latitude: 17.7816,
      longitude: 83.3821,
      plusOnes: 38,
      status: 'fixed',
      createdAt: now - 7 * day, // 7 days ago
      fixedAt: now - 2 * day, // fixed 2 days ago
      fixYes: 24,
      fixNo: 1,
      aiSeverity: 8,
      aiReason: 'Coastal saline humidity and sea spray eroded asphalt sub-base causing a deep 14cm pothole.',
      aiSituation: 'A sharp crater with exposed coarse aggregate sits right on the outer curve of the scenic beach road. Motorists were swerving into oncoming traffic to avoid rim damage.',
      aiHazard: 'High-speed motorcycle wipeouts and severe vehicular steering loss along the coastal bend.',
      aiDepartment: 'Roads & Bridges Department',
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
      areaName: 'MVP Colony',
      latitude: 17.7447,
      longitude: 83.3421,
      plusOnes: 31,
      status: 'fixed',
      createdAt: now - 11 * day, // 11 days ago
      fixedAt: now - 4 * day, // fixed 4 days ago
      fixYes: 21,
      fixNo: 2,
      aiSeverity: 7,
      aiReason: 'High pressure drinking water supply main joint ruptured washing away pavement ballast.',
      aiSituation: 'A pressurized cast-iron pipe joint failed underground, creating a 3-foot water fountain and flooding several hundred meters of residential street. Potable water loss was estimated at thousands of liters hourly.',
      aiHazard: 'Severe undermining of the adjacent road surface, low household water pressure, and risk of sinkholes.',
      aiDepartment: 'Water Supply & Sewerage Board',
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
      areaName: 'Gajuwaka',
      latitude: 17.6905,
      longitude: 83.2095,
      plusOnes: 52,
      status: 'fixed',
      createdAt: now - 9 * day, // 9 days ago
      fixedAt: now - 1 * day, // fixed 1 day ago
      fixYes: 5,
      fixNo: 14, // fixNo > fixYes => Demonstrates Disputed status!
      aiSeverity: 9,
      aiReason: 'Multi-axle steel truck loads pulverized asphalt into a cavernous crater on industrial corridor.',
      aiSituation: 'A massive 20cm trench-style pothole formed across the main container freight lane. Heavy commercial traffic was backed up for two kilometers as trucks crawled through the cavity.',
      aiHazard: 'Truck axle snaps, overturned cargo trailers, and fatal hazard to two-wheelers navigating around trucks.',
      aiDepartment: 'Roads & Bridges Department',
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
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load issues from localStorage:', err);
  }
  const fallback = getInitialDemoIssues();
  saveIssues(fallback);
  return fallback;
}

export function saveIssues(issues: Issue[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch (err) {
    console.error('Failed to save issues to localStorage:', err);
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
