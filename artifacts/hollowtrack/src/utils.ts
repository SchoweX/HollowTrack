import type { Feldwert } from './types';

export function slug(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export function newId(prefix: string): string { return `hollowtrack-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
export function sorted<T extends { position: number }>(items: T[] = []): T[] { return [...items].sort((a, b) => a.position - b.position); }
export function localDate(): string { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
export function formatDate(date: string): string { return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
export function formatDateTime(date?: string): string { return date ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Noch nicht vorhanden'; }
export function formatNumber(value: unknown): string { return typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : String(value); }
export function valueExists(value: unknown): value is Feldwert { return value !== undefined && value !== null && value !== ''; }
