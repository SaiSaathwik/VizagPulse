export type IssueType =
  | 'Pothole'
  | 'Drain / Sewage'
  | 'Garbage'
  | 'Streetlight'
  | 'Water leak'
  | 'Other';

export interface Issue {
  id: string;
  photoBefore: string;
  photoAfter?: string;
  type: IssueType;
  customType?: string;
  latitude: number | null;
  longitude: number | null;
  areaName?: string;
  plusOnes: number;
  status: 'open' | 'fixed';
  createdAt: number; // timestamp in ms
  fixedAt?: number; // timestamp in ms
  fixYes: number;
  fixNo: number;
  priority?: number; // 1-10
  priorityReason?: string;
  isAiPriority?: boolean;
}

export type TabType = 'feed' | 'report' | 'authority';

export type FeedFilter = 'all' | 'open' | 'fixed';
