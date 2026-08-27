export const PRODUCT_SLUG = 'mechanism-playground';
export const BILLING_BASE = 'https://api.sociobot.in/api/v1';
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const DAY = 86_400_000;

export interface LicenseState {
  unlocked: boolean;
  checking: boolean;
  reason?: string;
  token?: string;
}

interface CachedVerdict { valid: boolean; checkedAt: number; reason?: string }

function readVerdict(): CachedVerdict | null {
  try {
    const value = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as CachedVerdict | null;
    return value && typeof value.valid === 'boolean' ? value : null;
  } catch { return null; }
}

export function captureReturnedLicense(): string | null {
  const url = new URL(location.href);
  const returned = url.searchParams.get('license');
  if (!returned) return localStorage.getItem(LICENSE_KEY);
  localStorage.setItem(LICENSE_KEY, returned.trim());
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return returned.trim();
}

export async function initializeLicense(onChange: (state: LicenseState) => void): Promise<LicenseState> {
  const token = captureReturnedLicense();
  if (!token) {
    const state = { unlocked: false, checking: false };
    onChange(state);
    return state;
  }
  const cached = readVerdict();
  const optimistic = cached ? cached.valid : true;
  const initial = { unlocked: optimistic, checking: !cached || Date.now() - cached.checkedAt >= DAY, token };
  onChange(initial);
  if (cached && Date.now() - cached.checkedAt < DAY) return initial;
  try {
    const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const verdict = await response.json() as { valid: boolean; reason?: string };
    const stored: CachedVerdict = { valid: verdict.valid, checkedAt: Date.now(), reason: verdict.reason };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(stored));
    const next = { unlocked: verdict.valid, checking: false, reason: verdict.reason, token };
    onChange(next);
    return next;
  } catch {
    const next = { unlocked: cached?.valid ?? optimistic, checking: false, reason: 'offline', token };
    onChange(next);
    return next;
  }
}

export function restoreLicense(token: string): void {
  const clean = token.trim();
  if (!clean) throw new Error('Paste the license token from your receipt.');
  localStorage.setItem(LICENSE_KEY, clean);
  localStorage.removeItem(VERDICT_KEY);
}

export const CHECKOUT_URL = `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;
