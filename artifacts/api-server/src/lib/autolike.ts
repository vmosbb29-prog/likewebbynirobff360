import { db, autoLikeTasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSettings } from "./settings.js";
import { sendAutoLikeResult } from "./telegram.js";
import { logger } from "./logger.js";

let schedulerTimer: ReturnType<typeof setTimeout> | null = null;

export async function runAutoLike(): Promise<void> {
  logger.info("Auto-like batch starting");
  const settings = await getSettings();
  if (!settings.autoLikeEnabled) {
    logger.info("Auto-like disabled, skipping");
    return;
  }

  const tasks = await db.select().from(autoLikeTasksTable).where(eq(autoLikeTasksTable.active, true));
  logger.info({ count: tasks.length }, "Auto-like tasks to process");

  for (const task of tasks) {
    try {
      const apiUrl = settings.autoLikeApiUrl
        .replace("{uid}", task.uid)
        .replace("{region}", task.region)
        .replace("{server_name}", task.region);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      const json = await res.json() as Record<string, unknown>;

      const likesBefore = String(
        json.LikesbeforeCommand ?? json.LikesBefore ?? json.likes_before ?? json.before ?? "?"
      );
      const likesAfter = String(
        json.LikesafterCommand ?? json.LikesAfter ?? json.likes_after ?? json.after ?? "?"
      );
      const likesGivenRaw = json.LikesGivenByAPI ?? json.LikesGiven ?? json.likes_given ?? json.given ?? 0;
      const likesGiven = Number(likesGivenRaw);
      const playerNickname = String(json.PlayerNickname ?? json.nickname ?? task.playerNickname ?? "Player");
      const playerLevel = String(json.PlayerLevel ?? json.AccountLevel ?? json.level ?? task.playerLevel ?? "?");

      const success = res.ok && (json.status === 1 || json.status === "1" || json.success === true || likesGiven > 0);
      const newRemaining = Math.max(0, task.remaining - 1);
      const isExpired = newRemaining === 0;

      await db.update(autoLikeTasksTable)
        .set({
          remaining: newRemaining,
          active: !isExpired,
          totalLikesSent: task.totalLikesSent + (success ? likesGiven : 0),
          likesLastRun: success ? likesGiven : 0,
          playerNickname,
          playerLevel,
          likesBeforeLast: likesBefore,
          likesAfterLast: likesAfter,
          lastRunAt: new Date(),
        })
        .where(eq(autoLikeTasksTable.id, task.id));

      await sendAutoLikeResult({
        uid: task.uid,
        region: task.region,
        nickname: playerNickname,
        level: playerLevel,
        likesBefore,
        likesAfter,
        likesGiven,
        remaining: newRemaining,
        success,
      });

      logger.info({ uid: task.uid, success, likesGiven, remaining: newRemaining }, "Auto-like task processed");
    } catch (err) {
      logger.error({ uid: task.uid, err }, "Auto-like task error");
    }

    await new Promise(r => setTimeout(r, 2_000));
  }

  logger.info("Auto-like batch complete");
}

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const bstOffsetMs = 6 * 60 * 60 * 1000;
  const nowBst = new Date(now.getTime() + bstOffsetMs);
  const targetBst = new Date(nowBst);
  targetBst.setHours(hour, minute, 0, 0);
  if (targetBst <= nowBst) targetBst.setDate(targetBst.getDate() + 1);
  return targetBst.getTime() - nowBst.getTime();
}

export function startScheduler(): void {
  async function schedule() {
    const settings = await getSettings();
    const ms = msUntilNext(settings.autoLikeScheduleHour, settings.autoLikeScheduleMinute);
    logger.info({ ms, nextRunIn: `${Math.round(ms / 60_000)}m` }, "Auto-like scheduler: next run");
    schedulerTimer = setTimeout(async () => {
      try {
        await runAutoLike();
      } catch (err) {
        logger.error({ err }, "Auto-like scheduler error");
      }
      schedule();
    }, ms);
  }

  schedule().catch(err => logger.error({ err }, "Scheduler init error"));
}

export function stopScheduler(): void {
  if (schedulerTimer) clearTimeout(schedulerTimer);
}
