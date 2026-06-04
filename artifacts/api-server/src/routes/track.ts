import { Router } from "express";
import { heartbeat } from "../lib/online.js";

const router = Router();

router.post("/track", (req, res) => {
  const { sessionId, page } = req.body as { sessionId?: string; page?: string };
  if (sessionId && page) {
    heartbeat(sessionId, page);
  }
  res.json({ ok: true });
});

export default router;
