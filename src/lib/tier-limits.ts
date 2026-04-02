import { TIERS } from "@/contexts/AuthContext";

export interface TierLimits {
  tier: string;
  campaigns: number;
  sessionsPerMonth: number;
  sessionLengthMinutes: number;
  portraitsPerSession: number;
  detailedSummaries: boolean;
  dmTips: boolean;
  multiPartyTracking: boolean;
  earlyAccess: boolean;
}

const LIMITS: Record<string, TierLimits> = {
  free: {
    tier: "Apprentice",
    campaigns: 1,
    sessionsPerMonth: 1,
    sessionLengthMinutes: 240,
    portraitsPerSession: 0,
    detailedSummaries: false,
    dmTips: false,
    multiPartyTracking: false,
    earlyAccess: false,
  },
  [TIERS.tavernRegular.product_id]: {
    tier: "Tavern Regular",
    campaigns: 2,
    sessionsPerMonth: 4,
    sessionLengthMinutes: 240,
    portraitsPerSession: 1,
    detailedSummaries: false,
    dmTips: false,
    multiPartyTracking: false,
    earlyAccess: false,
  },
  [TIERS.adventurer.product_id]: {
    tier: "Adventurer",
    campaigns: 5,
    sessionsPerMonth: 8,
    sessionLengthMinutes: 240,
    portraitsPerSession: 2,
    detailedSummaries: true,
    dmTips: true,
    multiPartyTracking: false,
    earlyAccess: false,
  },
  [TIERS.guildMaster.product_id]: {
    tier: "Guild Master",
    campaigns: Infinity,
    sessionsPerMonth: Infinity,
    sessionLengthMinutes: Infinity,
    portraitsPerSession: Infinity,
    detailedSummaries: true,
    dmTips: true,
    multiPartyTracking: true,
    earlyAccess: true,
  },
};

export function getTierLimits(productId: string | null): TierLimits {
  if (!productId) return LIMITS.free;
  return LIMITS[productId] ?? LIMITS.free;
}

/** Check if a numeric usage is within the tier limit */
export function isWithinLimit(
  productId: string | null,
  key: keyof TierLimits,
  currentUsage: number
): boolean {
  const limits = getTierLimits(productId);
  const limit = limits[key];
  if (typeof limit === "boolean") return limit;
  return currentUsage < (limit as number);
}

/** Check if a feature (boolean) is enabled for the tier */
export function hasFeature(
  productId: string | null,
  key: keyof TierLimits
): boolean {
  const limits = getTierLimits(productId);
  const value = limits[key];
  if (typeof value === "boolean") return value;
  return value === Infinity || value > 0;
}
