import { Router } from "express";
import { db, keysTable, logsTable, bannedIpsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { getSettings } from "../lib/settings.js";
import { notifyLike, notifyVisit, notifyKeyCheck, notifyGiveawayLike } from "../lib/telegram.js";
import { logger } from "../lib/logger.js";

const router = Router();

function getIp(req: import("express").Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.ip ??
    "unknown"
  );
}

async function isBanned(ip: string): Promise<boolean> {
  const [row] = await db.select({ ip: bannedIpsTable.ip }).from(bannedIpsTable).where(eq(bannedIpsTable.ip, ip)).limit(1);
  return !!row;
}

router.get("/config", async (_req, res) => {
  const settings = await getSettings();
  res.json({
    likeEnabled: settings.likeEnabled,
    visitEnabled: settings.visitEnabled,
    autoLikeEnabled: settings.autoLikeEnabled,
    supportLinks: settings.supportLinks,
  });
});

router.get("/price-list", async (_req, res) => {
  const settings = await getSettings();
  res.json(settings.priceList);
});

router.get("/auto-like", async (_req, res) => {
  const { autoLikeTasksTable: alt } = await import("@workspace/db");
  const tasks = await db.select().from(alt).orderBy(alt.createdAt);
  const nextRun = "04:00 BST";
  res.json({ tasks, nextRun });
});

router.post("/check-key", async (req, res) => {
  const { key } = req.body as { key?: string };
  if (!key) { res.status(400).json({ message: "Key required" }); return; }

  const ip = getIp(req);
  const [row] = await db.select().from(keysTable).where(eq(keysTable.key, key.trim())).limit(1);

  await notifyKeyCheck(key.trim(), !!row && new Date(row.expiresAt).getTime() > Date.now(), ip).catch(() => {});

  if (!row) { res.status(404).json({ message: "Key not found" }); return; }

  res.json({
    key: row.key,
    keyType: row.keyType,
    expiresAt: row.expiresAt,
    likeUsed: row.likeUsed,
    visitUsed: row.visitUsed,
    usedCount: row.usedCount,
    useLimit: row.useLimit,
    dailyUseLimit: row.dailyUseLimit,
    dailyUseCount: row.dailyUseCount,
    dailyUseResetAt: row.dailyUseResetAt,
  });
});

router.post("/like", async (req, res) => {
  const { key, uid, region } = req.body as { key?: string; uid?: string; region?: string };
  if (!key || !uid || !region) {
    res.status(400).json({ message: "key, uid, and region are required" });
    return;
  }

  const ip = getIp(req);
  if (await isBanned(ip)) {
    res.status(403).json({ message: "Your IP is banned" });
    return;
  }

  const settings = await getSettings();
  if (!settings.likeEnabled) {
    res.status(503).json({ message: "Like service is currently disabled" });
    return;
  }

  const [keyRow] = await db.select().from(keysTable).where(eq(keysTable.key, key.trim())).limit(1);
  if (!keyRow) {
    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "like", status: "fail_invalid_key", ipAddress: ip });
    res.status(400).json({ message: "Invalid key" });
    return;
  }
  if (new Date(keyRow.expiresAt).getTime() < Date.now()) {
    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "like", status: "fail_expired_key", ipAddress: ip });
    res.status(400).json({ message: "Key has expired" });
    return;
  }
  if (keyRow.keyType === "visit") {
    res.status(400).json({ message: "This key is for visit only, not like" });
    return;
  }
  if (keyRow.likeUsed) {
    res.status(400).json({ message: "Like already used for this key" });
    return;
  }
  if (keyRow.useLimit !== null && keyRow.usedCount >= keyRow.useLimit) {
    res.status(400).json({ message: "Key usage limit reached" });
    return;
  }

  const now = new Date();
  if (keyRow.dailyUseLimit !== null) {
    const resetAt = keyRow.dailyUseResetAt;
    const isDailyReset = !resetAt || resetAt < now;
    const dailyCount = isDailyReset ? 0 : keyRow.dailyUseCount;
    if (!isDailyReset && dailyCount >= keyRow.dailyUseLimit) {
      res.status(400).json({ message: "Daily limit reached for this key" });
      return;
    }
    const nextReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await db.update(keysTable).set({
      likeUsed: true,
      usedCount: keyRow.usedCount + 1,
      dailyUseCount: dailyCount + 1,
      dailyUseResetAt: isDailyReset ? nextReset : keyRow.dailyUseResetAt,
    }).where(eq(keysTable.key, key.trim()));
  } else {
    await db.update(keysTable).set({ likeUsed: true, usedCount: keyRow.usedCount + 1 }).where(eq(keysTable.key, key.trim()));
  }

  if (!settings.likeApiUrl) {
    res.status(503).json({ message: "Like API not configured" });
    return;
  }

  const apiUrl = settings.likeApiUrl.replace("{uid}", uid).replace("{region}", region).replace("{server_name}", region);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const apiRes = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await apiRes.json() as Record<string, unknown>;

    const likesBefore = json.LikesbeforeCommand ?? json.LikesBefore ?? json.likes_before ?? null;
    const likesAfter  = json.LikesafterCommand  ?? json.LikesAfter  ?? json.likes_after  ?? null;
    const likesGiven  = json.LikesGivenByAPI    ?? json.LikesGiven  ?? json.likes_given  ?? null;
    const playerNickname = json.PlayerNickname ?? json.nickname ?? null;
    const playerLevel    = json.PlayerLevel ?? json.AccountLevel ?? null;

    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "like", status: "success", ipAddress: ip });
    notifyLike(uid, region, key.trim(), ip, {
      likesBefore: likesBefore != null ? Number(likesBefore) : null,
      likesAfter:  likesAfter  != null ? Number(likesAfter)  : null,
      likesGiven:  likesGiven  != null ? Number(likesGiven)  : null,
      playerNickname: playerNickname != null ? String(playerNickname) : null,
      playerLevel:    playerLevel    != null ? String(playerLevel)    : null,
    }).catch(() => {});

    res.json({
      success: true,
      likesBefore,
      likesAfter,
      likesGiven,
      playerNickname,
      playerLevel,
      raw: json,
    });
  } catch (err) {
    logger.error({ err }, "Like API error");
    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "like", status: "fail_api_error", ipAddress: ip });
    res.status(502).json({ message: "Like API error, please try again" });
  }
});

router.post("/visit", async (req, res) => {
  const { key, uid, region } = req.body as { key?: string; uid?: string; region?: string };
  if (!key || !uid || !region) {
    res.status(400).json({ message: "key, uid, and region are required" });
    return;
  }

  const ip = getIp(req);
  if (await isBanned(ip)) {
    res.status(403).json({ message: "Your IP is banned" });
    return;
  }

  const settings = await getSettings();
  if (!settings.visitEnabled) {
    res.status(503).json({ message: "Visit service is currently disabled" });
    return;
  }

  const [keyRow] = await db.select().from(keysTable).where(eq(keysTable.key, key.trim())).limit(1);
  if (!keyRow) {
    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "visit", status: "fail_invalid_key", ipAddress: ip });
    res.status(400).json({ message: "Invalid key" });
    return;
  }
  if (new Date(keyRow.expiresAt).getTime() < Date.now()) {
    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "visit", status: "fail_expired_key", ipAddress: ip });
    res.status(400).json({ message: "Key has expired" });
    return;
  }
  if (keyRow.keyType === "like") {
    res.status(400).json({ message: "This key is for like only, not visit" });
    return;
  }
  if (keyRow.visitUsed) {
    res.status(400).json({ message: "Visit already used for this key" });
    return;
  }
  if (keyRow.useLimit !== null && keyRow.usedCount >= keyRow.useLimit) {
    res.status(400).json({ message: "Key usage limit reached" });
    return;
  }

  const now = new Date();
  if (keyRow.dailyUseLimit !== null) {
    const resetAt = keyRow.dailyUseResetAt;
    const isDailyReset = !resetAt || resetAt < now;
    const dailyCount = isDailyReset ? 0 : keyRow.dailyUseCount;
    if (!isDailyReset && dailyCount >= keyRow.dailyUseLimit) {
      res.status(400).json({ message: "Daily limit reached for this key" });
      return;
    }
    const nextReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await db.update(keysTable).set({
      visitUsed: true,
      usedCount: keyRow.usedCount + 1,
      dailyUseCount: dailyCount + 1,
      dailyUseResetAt: isDailyReset ? nextReset : keyRow.dailyUseResetAt,
    }).where(eq(keysTable.key, key.trim()));
  } else {
    await db.update(keysTable).set({ visitUsed: true, usedCount: keyRow.usedCount + 1 }).where(eq(keysTable.key, key.trim()));
  }

  if (!settings.visitApiUrl) {
    res.status(503).json({ message: "Visit API not configured" });
    return;
  }

  const apiUrl = settings.visitApiUrl.replace("{uid}", uid).replace("{region}", region).replace("{server_name}", region);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const apiRes = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await apiRes.json() as Record<string, unknown>;

    const visitCount = json.VisitCount ?? json.visit_count ?? json.count ?? null;
    const playerNickname = json.PlayerNickname ?? json.nickname ?? null;
    const playerLevel    = json.PlayerLevel ?? json.AccountLevel ?? null;

    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "visit", status: "success", ipAddress: ip });
    notifyVisit(uid, region, key.trim(), ip, {
      visitCount: visitCount != null ? Number(visitCount) : null,
      playerNickname: playerNickname != null ? String(playerNickname) : null,
      playerLevel:    playerLevel    != null ? String(playerLevel)    : null,
    }).catch(() => {});

    res.json({ success: true, visitCount, playerNickname, playerLevel, raw: json });
  } catch (err) {
    logger.error({ err }, "Visit API error");
    await db.insert(logsTable).values({ key: key.trim(), uid, region, action: "visit", status: "fail_api_error", ipAddress: ip });
    res.status(502).json({ message: "Visit API error, please try again" });
  }
});

router.get("/giveaway-status", async (_req, res) => {
  const settings = await getSettings();
  const now = Date.now();
  const endsAt = settings.giveawayEndsAt;
  const notExpired = !endsAt || new Date(endsAt).getTime() > now;
  const active = settings.giveawayEnabled && notExpired;

  if (settings.giveawayEnabled && endsAt && !notExpired) {
    await import("./public.js").catch(() => {});
    const { saveSettings } = await import("../lib/settings.js");
    await saveSettings({ giveawayEnabled: false }).catch(() => {});
  }

  res.json({
    active,
    endsAt: endsAt ?? null,
    telegramUrl: settings.supportLinks.telegramUrl || "https://t.me/NIROBFF360",
    telegramChannelUrl: settings.supportLinks.telegramChannelUrl || "https://t.me/likebynirob",
    telegramGroupUrl: settings.supportLinks.telegramGroupUrl || "https://t.me/likebynirobgp",
  });
});

router.post("/giveaway-like", async (req, res) => {
  const { uid, region } = req.body as { uid?: string; region?: string };
  if (!uid || !region) {
    res.status(400).json({ message: "uid and region are required" });
    return;
  }

  const ip = getIp(req);
  if (await isBanned(ip)) {
    res.status(403).json({ message: "Your IP is banned" });
    return;
  }

  const settings = await getSettings();
  const now = Date.now();
  const endsAt = settings.giveawayEndsAt;
  const notExpired = !endsAt || new Date(endsAt).getTime() > now;
  const active = settings.giveawayEnabled && notExpired;

  if (!active) {
    res.status(503).json({ message: "Giveaway is not currently active" });
    return;
  }

  if (!settings.likeApiUrl) {
    res.status(503).json({ message: "Like API not configured" });
    return;
  }

  const apiUrl = settings.likeApiUrl.replace("{uid}", uid).replace("{region}", region).replace("{server_name}", region);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const apiRes = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await apiRes.json() as Record<string, unknown>;

    const likesBefore = json.LikesbeforeCommand ?? json.LikesBefore ?? json.likes_before ?? null;
    const likesAfter  = json.LikesafterCommand  ?? json.LikesAfter  ?? json.likes_after  ?? null;
    const likesGiven  = json.LikesGivenByAPI    ?? json.LikesGiven  ?? json.likes_given  ?? null;
    const playerNickname = json.PlayerNickname ?? json.nickname ?? null;
    const playerLevel    = json.PlayerLevel ?? json.AccountLevel ?? null;

    await db.insert(logsTable).values({ uid, region, action: "like", status: "success", ipAddress: ip });
    notifyGiveawayLike(uid, region, ip, {
      likesBefore: likesBefore != null ? Number(likesBefore) : null,
      likesAfter:  likesAfter  != null ? Number(likesAfter)  : null,
      likesGiven:  likesGiven  != null ? Number(likesGiven)  : null,
      playerNickname: playerNickname != null ? String(playerNickname) : null,
    }).catch(() => {});

    res.json({ success: true, likesBefore, likesAfter, likesGiven, playerNickname, playerLevel, raw: json });
  } catch (err) {
    logger.error({ err }, "Giveaway like API error");
    res.status(502).json({ message: "Like API error, please try again" });
  }
});

router.get("/player-info", async (req, res) => {
  const { uid } = req.query as { uid?: string };
  if (!uid || !/^\d{6,12}$/.test(uid)) {
    res.status(400).json({ message: "Valid UID required (6-12 digits)" });
    return;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const apiRes = await fetch(`https://infoapibynirob.vercel.app/accinfo?uid=${uid}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!apiRes.ok) {
      res.status(apiRes.status).json({ message: "Player not found" });
      return;
    }
    const json = await apiRes.json();
    res.json(json);
  } catch (err) {
    logger.error({ err }, "Player info API error");
    res.status(502).json({ message: "Player info API unavailable" });
  }
});

export default router;
