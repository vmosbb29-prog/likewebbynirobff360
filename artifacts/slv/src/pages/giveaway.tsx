import { useState, useEffect, useCallback } from "react";
import { useLang, REGIONS } from "@/lib/i18n";
import { Gift, Heart, CheckCircle, XCircle, Clock, Send, MessageCircle, TrendingUp, TrendingDown } from "lucide-react";

interface GiveawayStatus {
  active: boolean;
  endsAt: string | null;
  telegramUrl: string;
  telegramChannelUrl: string;
  telegramGroupUrl: string;
}

interface LikeResult {
  success: boolean;
  likesBefore?: string | number | null;
  likesAfter?: string | number | null;
  likesGiven?: string | number | null;
  playerNickname?: string | null;
  playerLevel?: string | null;
}

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    if (!endsAt) { setRemaining(""); return; }
    function update() {
      const ms = new Date(endsAt!).getTime() - Date.now();
      if (ms <= 0) { setRemaining("Ended"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return remaining;
}

export default function Giveaway() {
  const { t } = useLang();
  const [status, setStatus] = useState<GiveawayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [region, setRegion] = useState("IND");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LikeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const remaining = useCountdown(status?.endsAt ?? null);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/public/giveaway-status");
      const data = await r.json() as GiveawayStatus;
      setStatus(data);
    } catch {
      setStatus({ active: false, endsAt: null, telegramUrl: "https://t.me/NIROBFF360", telegramChannelUrl: "https://t.me/likebynirob", telegramGroupUrl: "https://t.me/likebynirobgp" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const r = await fetch("/api/public/giveaway-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: uid.trim(), region }),
      });
      const data = await r.json() as LikeResult & { message?: string };
      if (!r.ok) setError(data.message ?? "Error");
      else setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const before = result?.likesBefore != null ? Number(result.likesBefore) : null;
  const after  = result?.likesAfter  != null ? Number(result.likesAfter)  : null;
  const given  = result?.likesGiven  != null ? Number(result.likesGiven)  : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 ring-1 ring-rose-700/30 animate-pulse-glow">
          <Gift size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.giveaway}</h1>
          <p className="text-xs text-slate-400">Free likes — no key required!</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="animate-spin h-8 w-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full" />
        </div>
      ) : status?.active ? (
        <div className="space-y-4">
          <div className="card-glass rounded-2xl p-5 border-rose-800/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-600/20">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t.giveawayActive}</p>
                <p className="text-xs text-slate-400">No key needed — everyone can claim!</p>
              </div>
            </div>
            {status.endsAt && remaining && remaining !== "Ended" && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-2">
                <Clock size={13} className="text-amber-400" />
                <span className="text-xs text-slate-400">Ends in:</span>
                <span className="text-sm font-bold text-amber-400 font-mono">{remaining}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.enterUid}</label>
              <input
                className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                placeholder="Free Fire UID"
                value={uid}
                onChange={e => setUid(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.selectRegion}</label>
              <select
                className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:border-blue-500/60 focus:outline-none"
                value={region}
                onChange={e => setRegion(e.target.value)}
              >
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r} — {t.regions[r]}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !uid.trim()}
              className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t.loading}</>
              ) : (
                <><Gift size={15} /> {t.sendGiveawayLike}</>
              )}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-800/40 bg-red-900/20 p-4 animate-fade-in-up">
              <XCircle size={18} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result?.success && (
            <div className="card-glass rounded-2xl p-5 space-y-4 animate-fade-in-up border-green-800/40">
              <div className="flex items-center gap-3">
                <CheckCircle size={22} className="text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white">Likes Sent! 🎉</p>
                  {result.playerNickname && <p className="text-xs text-slate-400">{result.playerNickname}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1"><TrendingDown size={11} /> Before</div>
                  <p className="text-lg font-bold text-slate-300">{before ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-pink-900/20 border border-pink-800/30 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-pink-400 mb-1"><Heart size={11} /> Sent</div>
                  <p className="text-lg font-bold text-pink-400">+{given ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-green-900/20 border border-green-800/30 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-green-400 mb-1"><TrendingUp size={11} /> After</div>
                  <p className="text-lg font-bold text-green-400">{after ?? "—"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card-glass rounded-2xl p-10 text-center space-y-4 border-slate-800/50">
            <Gift size={48} className="mx-auto text-slate-700 animate-float" />
            <div>
              <p className="font-bold text-white text-lg">{t.giveawayInactive}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.giveawayJoin}</p>
            </div>
            <div className="flex flex-col gap-2 items-center">
              {status?.telegramChannelUrl && (
                <a href={status.telegramChannelUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all">
                  <Send size={14} /> Join Telegram Channel
                </a>
              )}
              {status?.telegramGroupUrl && (
                <a href={status.telegramGroupUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-blue-800/40 bg-blue-950/30 px-5 py-2.5 text-sm text-blue-300 hover:text-white transition-all">
                  <MessageCircle size={14} /> Join Group
                </a>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-slate-600">
            Admin activates giveaways periodically. Join our channel to get notified instantly.
          </p>
        </div>
      )}
    </div>
  );
}
