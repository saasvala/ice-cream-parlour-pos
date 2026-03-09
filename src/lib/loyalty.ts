// ─── Loyalty Tiers & Points Config ────────────────────────────

export const POINTS_PER_100 = 10; // base: earn 10 points per ₹100
export const POINTS_VALUE = 1;    // 1 point = ₹1 discount

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  icon: string;
  color: string;       // tailwind-compatible
  multiplier: number;  // bonus multiplier on base earn rate
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze',   minPoints: 0,    icon: '🥉', color: 'text-amber-700 dark:text-amber-600',    multiplier: 1.0 },
  { name: 'Silver',   minPoints: 100,  icon: '🥈', color: 'text-slate-500 dark:text-slate-400',    multiplier: 1.25 },
  { name: 'Gold',     minPoints: 500,  icon: '🥇', color: 'text-yellow-600 dark:text-yellow-400',  multiplier: 1.5 },
  { name: 'Platinum', minPoints: 1000, icon: '💎', color: 'text-cyan-500 dark:text-cyan-400',      multiplier: 2.0 },
];

export function getTier(totalPoints: number): LoyaltyTier {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (totalPoints >= LOYALTY_TIERS[i].minPoints) return LOYALTY_TIERS[i];
  }
  return LOYALTY_TIERS[0];
}

export function getNextTier(totalPoints: number): LoyaltyTier | null {
  const current = getTier(totalPoints);
  const idx = LOYALTY_TIERS.indexOf(current);
  return idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[idx + 1] : null;
}

export function calcEarnedPoints(totalAmount: number, currentPoints: number): number {
  const tier = getTier(currentPoints);
  return Math.floor((totalAmount / 100) * POINTS_PER_100 * tier.multiplier);
}

// ─── Points History ──────────────────────────────────────────

export interface LoyaltyEvent {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  date: string;
  tier?: string;
}
