const timeFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const fullDateFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
const numberFmt = new Intl.NumberFormat('id-ID');

export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'kemarin';
  if (days < 7) return `${days} hr`;
  return dateFmt.format(ts);
}

export function formatTime(ts) {
  return ts ? timeFmt.format(ts) : '';
}

export function formatFullDate(ts = Date.now()) {
  return fullDateFmt.format(ts);
}

export function sameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function dayDivider(ts) {
  if (sameDay(ts, Date.now())) return 'Hari ini';
  if (sameDay(ts, Date.now() - 86400000)) return 'Kemarin';
  return fullDateFmt.format(ts);
}

export function shortDay(dateKey) {
  return dayFmt.format(new Date(`${dateKey}T00:00:00`));
}

export function shortDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).getDate();
}

export function initials(name = '') {
  const parts = String(name)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function formatNumber(value) {
  return numberFmt.format(Number(value) || 0);
}

export function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return `${digits.startsWith('+') ? '' : '+'}${digits}`;
}

export const TICKET_STATUS = {
  open: { label: 'Baru', tone: 'sky' },
  pending: { label: 'Diproses', tone: 'amber' },
  resolved: { label: 'Selesai', tone: 'emerald' },
};

export const PRIORITY = {
  low: { label: 'Rendah', tone: 'slate' },
  normal: { label: 'Normal', tone: 'sky' },
  high: { label: 'Tinggi', tone: 'rose' },
};

export const ACCOUNT_STATUS = {
  connected: { label: 'Terhubung', tone: 'emerald' },
  qr: { label: 'Menunggu scan', tone: 'amber' },
  connecting: { label: 'Menghubungkan', tone: 'sky' },
  disconnected: { label: 'Terputus', tone: 'slate' },
};
