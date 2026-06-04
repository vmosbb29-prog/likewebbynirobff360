import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface PriceItem {
  label: string;
  price: string;
  description?: string;
}

export interface SettingsData {
  adminPasswordHash: string;
  likeEnabled: boolean;
  visitEnabled: boolean;
  likeApiUrl: string;
  visitApiUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  autoLikeEnabled: boolean;
  autoLikeApiUrl: string;
  autoLikeScheduleHour: number;
  autoLikeScheduleMinute: number;
  giveawayEnabled: boolean;
  giveawayEndsAt: string | null;
  priceList: {
    currency: string;
    contactInfo: string;
    likeItems: PriceItem[];
    visitItems: PriceItem[];
    autoLikeItems: PriceItem[];
  };
  supportLinks: {
    telegramUrl: string;
    whatsappUrl: string;
    telegramChannelUrl: string;
    telegramGroupUrl: string;
  };
}

export const DEFAULT_SETTINGS: SettingsData = {
  adminPasswordHash: "",
  likeEnabled: true,
  visitEnabled: true,
  likeApiUrl: "",
  visitApiUrl: "",
  telegramBotToken: "",
  telegramChatId: "",
  autoLikeEnabled: false,
  autoLikeApiUrl: "https://nirob-like-api-new-no-lag.vercel.app/like?uid={uid}&server_name={region}",
  autoLikeScheduleHour: 4,
  autoLikeScheduleMinute: 0,
  giveawayEnabled: false,
  giveawayEndsAt: null,
  priceList: {
    currency: "৳",
    contactInfo: "Contact: @NIROBFF360",
    likeItems: [],
    visitItems: [],
    autoLikeItems: [],
  },
  supportLinks: {
    telegramUrl: "https://t.me/NIROBFF360",
    whatsappUrl: "",
    telegramChannelUrl: "https://t.me/likebynirob",
    telegramGroupUrl: "https://t.me/likebynirobgp",
  },
};

let cachedSettings: SettingsData | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000;

export async function getSettings(): Promise<SettingsData> {
  if (cachedSettings && Date.now() - cacheTime < CACHE_TTL) {
    return cachedSettings;
  }
  const [row] = await db.select().from(settingsTable).limit(1);
  if (!row) {
    return DEFAULT_SETTINGS;
  }
  cachedSettings = { ...DEFAULT_SETTINGS, ...(row.data as Partial<SettingsData>) };
  cacheTime = Date.now();
  return cachedSettings;
}

export function invalidateCache() {
  cachedSettings = null;
  cacheTime = 0;
}

export async function saveSettings(updates: Partial<SettingsData>): Promise<void> {
  const current = await getSettings();
  const merged: SettingsData = { ...current, ...updates };
  const [existing] = await db.select({ id: settingsTable.id }).from(settingsTable).limit(1);
  if (existing) {
    await db.update(settingsTable)
      .set({ data: merged as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(settingsTable.id, existing.id));
  } else {
    await db.insert(settingsTable).values({ data: merged as unknown as Record<string, unknown>, updatedAt: new Date() });
  }
  invalidateCache();
}
