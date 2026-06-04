import { Router } from "express";
import publicRouter from "./public.js";
import adminRouter from "./admin.js";
import trackRouter from "./track.js";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

router.use("/public", publicRouter);
router.use("/admin", adminRouter);
router.use(trackRouter);

export default router;
