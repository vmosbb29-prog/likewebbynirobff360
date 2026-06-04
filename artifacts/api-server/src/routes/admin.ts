import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, keysTable, logsTable, settingsTable, bannedIpsTable, autoLikeTasksTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { getSettings, saveSettings, invalidateCache } from "../lib/settings.js";
import { requireAdmin } from "../middlewares/auth.js";
import { runAutoLike } from "../lib/autolike.js";
import { notifyAdminLogin, notifyKeyCreated, notifyKeyDeleted, notifyIpBanned } from "../lib/telegram.js";
import { getOnlineCount } from "../lib/online.js";
import { logger } from "../lib/logger.js";

const router = Router();

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

router.post("/login", async (req, res) => {
  const { password } = req.body as { password?: string };
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";

  if (!password) { res.status(400).json({ message: "Password required" }); return; }

  const settings = await getSettings();
  let valid = false;

  if (settings.adminPasswordHash) {
    valid = bcrypt.compareSync(password, settings.adminPasswordHash);
  } else {
    valid = password === "nirob360";
  }

  notifyAdminLogin(valid, ip).catch(() => {});

  if (!valid) {
    res.status(401).json({ message: "Invalid password" });
    return;
  }

  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "7d" });
  res.json({ token });
});

router.use(requireAdmin);

router.get("/stats", async (_req, res) => {
  const [totalKeys] = await db.select({ count: count() }).from(keysTable);
  const [activeKeys] = await db.select({ count: count() }).from(keysTable).where(eq(keysTable.likeUsed, false));
  const [totalLogs] = await db.select({ count: count() }).from(logsTable);
  const [likeLogs] = await db.select({ count: count() }).from(logsTable).where(eq(logsTable.action, "like"));
  const [visitLogs] = await db.select({ count: count() }).from(logsTable).where(eq(logsTable.action, "visit"));
  const [bannedIps] = await db.select({ count: count() }).from(bannedIpsTable);
  const onlineUsers = getOnlineCount();

  res.json({
    totalKeys: totalKeys?.count ?? 0,
    activeKeys: activeKeys?.count ?? 0,
    totalLikes: likeLogs?.count ?? 0,
    totalVisits: visitLogs?.count ?? 0,
    totalLogs: totalLogs?.count ?? 0,
    bannedIps: bannedIps?.count ?? 0,
    onlineUsers,
  });
});

router.get("/keys", async (_req, res) => {
  const keys = await db.select().from(keysTable).orderBy(desc(keysTable.createdAt));
  res.json(keys);
});

router.post("/keys", async (req, res) => {
  const { days = 30, useLimit = null, dailyUseLimit = null, keyType = "both", customKey } = req.body as {
    days?: number; useLimit?: number | null; dailyUseLimit?: number | null; keyType?: string; customKey?: string;
  };

  const key = customKey?.trim() || generateKey();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const [existing] = await db.select({ key: keysTable.key }).from(keysTable).where(eq(keysTable.key, key)).limit(1);
  if (existing) { res.status(400).json({ message: "Key already exists" }); return; }

  await db.insert(keysTable).values({ key, keyType, expiresAt, useLimit: useLimit ?? null, dailyUseLimit: dailyUseLimit ?? null });
  notifyKeyCreated(key, days, useLimit ?? null, keyType).catch(() => {});

  res.status(201).json({ key, keyType, expiresAt, useLimit, dailyUseLimit });
});

router.delete("/keys/:key", async (req, res) => {
  const { key } = req.params;
  await db.delete(keysTable).where(eq(keysTable.key, key));
  notifyKeyDeleted(key).catch(() => {});
  res.json({ ok: true });
});

router.get("/logs", async (_req, res) => {
  const logs = await db.select().from(logsTable).orderBy(desc(logsTable.createdAt)).limit(200);
  res.json(logs);
});

router.get("/settings", async (_req, res) => {
  const s = await getSettings();
  const { adminPasswordHash: _, ...rest } = s;
  void _;
  res.json(rest);
});

router.put("/settings", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { adminPassword, ...updates } = body as { adminPassword?: string } & Record<string, unknown>;
  if (adminPassword) {
    (updates as Record<string, unknown>).adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
  }
  await saveSettings(updates as Parameters<typeof saveSettings>[0]);
  res.json({ ok: true });
});

router.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body as { oldPassword?: string; newPassword?: string };
  if (!oldPassword || !newPassword) { res.status(400).json({ message: "Both passwords required" }); return; }

  const settings = await getSettings();
  let valid = false;
  if (settings.adminPasswordHash) {
    valid = bcrypt.compareSync(oldPassword, settings.adminPasswordHash);
  } else {
    valid = oldPassword === "nirob360";
  }

  if (!valid) { res.status(401).json({ message: "Old password incorrect" }); return; }

  await saveSettings({ adminPasswordHash: bcrypt.hashSync(newPassword, 10) });
  res.json({ ok: true });
});

router.get("/banned-ips", async (_req, res) => {
  const rows = await db.select().from(bannedIpsTable).orderBy(desc(bannedIpsTable.createdAt));
  res.json(rows);
});

router.post("/ban-ip", async (req, res) => {
  const { ip } = req.body as { ip?: string };
  if (!ip) { res.status(400).json({ message: "IP required" }); return; }
  await db.insert(bannedIpsTable).values({ ip }).onConflictDoNothing();
  notifyIpBanned(ip).catch(() => {});
  res.json({ ok: true });
});

router.delete("/ban-ip/:ip", async (req, res) => {
  const { ip } = req.params;
  await db.delete(bannedIpsTable).where(eq(bannedIpsTable.ip, ip));
  res.json({ ok: true });
});

router.get("/auto-like", async (_req, res) => {
  const tasks = await db.select().from(autoLikeTasksTable).orderBy(desc(autoLikeTasksTable.createdAt));
  res.json(tasks);
});

router.post("/auto-like", async (req, res) => {
  const { uid, region, days } = req.body as { uid?: string; region?: string; days?: number };
  if (!uid || !region || !days) { res.status(400).json({ message: "uid, region, days required" }); return; }

  const [existing] = await db.select().from(autoLikeTasksTable).where(eq(autoLikeTasksTable.uid, uid.trim())).limit(1);
  if (existing) {
    await db.update(autoLikeTasksTable)
      .set({ days: existing.days + days, remaining: existing.remaining + days, active: true, region })
      .where(eq(autoLikeTasksTable.id, existing.id));
    res.json({ ok: true, extended: true });
  } else {
    await db.insert(autoLikeTasksTable).values({ uid: uid.trim(), region, days, remaining: days });
    res.status(201).json({ ok: true });
  }
});

router.patch("/auto-like/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { active } = req.body as { active?: boolean };
  await db.update(autoLikeTasksTable).set({ active: active ?? true }).where(eq(autoLikeTasksTable.id, id));
  res.json({ ok: true });
});

router.delete("/auto-like/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(autoLikeTasksTable).where(eq(autoLikeTasksTable.id, id));
  res.json({ ok: true });
});

router.post("/auto-like/run-now", async (_req, res) => {
  res.json({ ok: true, message: "Running in background" });
  runAutoLike().catch(err => logger.error({ err }, "Manual auto-like run error"));
});

router.post("/telegram/test", async (_req, res) => {
  const settings = await getSettings();
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    res.status(400).json({ message: "Telegram not configured" });
    return;
  }
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: settings.telegramChatId, text: "✅ Telegram test from Like By Nirob!" }) }
    );
    if (!r.ok) { res.status(400).json({ message: "Telegram send failed" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: String(err) });
  }
});

export default router;
