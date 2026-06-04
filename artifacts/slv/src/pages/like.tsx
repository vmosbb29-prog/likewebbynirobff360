import { useState } from "react";
import { useLang, REGIONS } from "@/lib/i18n";
import { Heart, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LikeResult {
  success: boolean;
  likesBefore?: string | number | null;
  likesAfter?: string | number | null;
  likesGiven?: string | number | null;
  playerNickname?: string | null;
  playerLevel?: string | null;
}

export default function Like() {
  const { t } = useLang();
  const [key, setKey] = useState("");
  const [uid, setUid] = useState("");
  const [region, setRegion] = useState("IND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LikeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await fetch("/api/public/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), uid: uid.trim(), region }),
      });
      const data = await r.json() as LikeResult & { message?: string };
      if (!r.ok) setError(data.message ?? "Error");
      else setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const before = result?.likesBefore != null ? Number(result.likesBefore) : null;
  const after  = result?.likesAfter  != null ? Number(result.likesAfter)  : null;
  const given  = result?.likesGiven  != null ? Number(result.likesGiven)  : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600/20 text-pink-400 ring-1 ring-pink-700/30 animate-pulse-glow">
          <Heart size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.like}</h1>
          <p className="text-xs text-slate-400">Send likes to any Free Fire account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.enterKey}</label>
          <input
            className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={key}
            onChange={e => setKey(e.target.value)}
            required
          />
        </div>
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
            className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
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
          disabled={loading || !key.trim() || !uid.trim()}
          className="w-full rounded-xl bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t.loading}</>
          ) : (
            <><Heart size={15} /> {t.sendLike}</>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-800/40 bg-red-900/20 p-4 animate-fade-in-up">
          <XCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result?.success && (
        <div className="mt-4 card-glass rounded-2xl p-5 space-y-4 animate-fade-in-up border-green-800/40">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">{t.success}</p>
              {result.playerNickname && (
                <p className="text-xs text-slate-400">
                  {result.playerNickname}
                  {result.playerLevel && ` • Level ${result.playerLevel}`}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                <TrendingDown size={11} /> Before
              </div>
              <p className="text-lg font-bold text-slate-300">{before ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-pink-900/20 border border-pink-800/30 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-pink-400 mb-1">
                <Heart size={11} /> Sent
              </div>
              <p className="text-lg font-bold text-pink-400">+{given ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-green-900/20 border border-green-800/30 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-green-400 mb-1">
                <TrendingUp size={11} /> After
              </div>
              <p className="text-lg font-bold text-green-400">{after ?? "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
