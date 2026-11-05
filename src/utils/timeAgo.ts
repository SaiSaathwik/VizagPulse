export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 hr ago' : `${diffHours} hrs ago`;
  }
  if (diffMin > 0) {
    return diffMin === 1 ? '1 min ago' : `${diffMin} mins ago`;
  }
  return 'Just now';
}

export function getDaysOpen(createdAt: number): number {
  const now = Date.now();
  const diffMs = Math.max(0, now - createdAt);
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDaysOpen(createdAt: number): string {
  const days = getDaysOpen(createdAt);
  return `Open for ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function formatDaysToFix(createdAt: number, fixedAt?: number): string {
  const end = fixedAt || Date.now();
  const diffMs = Math.max(0, end - createdAt);
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `Fixed in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }

  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return `Fixed in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
}
