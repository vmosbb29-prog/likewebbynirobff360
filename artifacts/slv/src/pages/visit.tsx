import { useState } from "react";
import { useLang, REGIONS } from "@/lib/i18n";
import { Eye, CheckCircle, XCircle } from "lucide-react";

interface VisitResult {
  success: boolean;
  visitCount?: string | number | null;
  playerNickname?: string | null;
  playerLevel?: string | null;
}

export default function Visit() {
  const { t } = useLang();
  const [key, setKey] = useState("");
  const [uid, setUid] = useState("");
  const [region, setRegion] = useState("IND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await fetch("/api/public/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), uid: uid.trim(), region }),
      });
      const data = await r.json() as VisitResult & { message?: string };
      if (!r.ok) setError(data.message ?? "Error");
      else setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 ring-1 ring-purple-700/30">
          <Eye size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.visit}</h1>
          <p className="text-xs text-slate-400">Send profile visits to any Free Fire account</p>
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
          disabled={loading || !key.trim() || !uid.trim()}
          className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t.loading}</>
          ) : (
            <><Eye size={15} /> {t.sendVisit}</>
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
        <div className="mt-4 card-glass rounded-2xl p-5 space-y-3 animate-fade-in-up border-purple-800/40">
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
          {result.visitCount != null && (
            <div className="rounded-xl bg-purple-900/20 border border-purple-800/30 p-3 text-center">
              <p className="text-xs text-purple-400 mb-1">Visits Sent</p>
              <p className="text-2xl font-bold text-purple-300">{result.visitCount}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
