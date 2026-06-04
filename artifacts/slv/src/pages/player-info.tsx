import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { User, Search, Heart, Star, Shield, Award, Users, Zap } from "lucide-react";

interface BasicInfo {
  nickname?: string;
  accountId?: string;
  level?: number;
  region?: string;
  likes?: number;
  liked?: number;
  seasonId?: number;
  creditScore?: number;
  title?: string;
  bio?: string;
  releaseVersion?: string;
  brRankPoints?: number;
  brMaxRankPoints?: number;
  csRankPoints?: number;
  csMaxRankPoints?: number;
  avatarId?: number;
  bannerId?: number;
  badgeCnt?: number;
  showBrRank?: number;
  showCsRank?: number;
  accountType?: number;
}

interface ClanInfo {
  clanId?: string;
  clanName?: string;
  clanLevel?: number;
  memberNum?: number;
}

interface PetInfo {
  petId?: number;
  petLevel?: number;
  petExp?: number;
  isSelected?: boolean;
  skinId?: number;
  selectedSkillId?: number;
}

interface PlayerData {
  basicInfo?: BasicInfo;
  clanBasicInfo?: ClanInfo;
  petInfo?: PetInfo;
  socialInfo?: { signature?: string };
}

function InfoRow({ label, value, color = "text-slate-300" }: { label: string; value?: string | number | null; color?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-medium ${color}`}>{String(value)}</span>
    </div>
  );
}

export default function PlayerInfo() {
  const { t } = useLang();
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const r = await fetch(`/api/public/player-info?uid=${uid.trim()}`);
      const json = await r.json() as PlayerData & { message?: string };
      if (!r.ok) setError(json.message ?? "Player not found");
      else setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const basic = data?.basicInfo;
  const clan  = data?.clanBasicInfo;
  const pet   = data?.petInfo;
  const banner = uid ? `https://bannerapibynirobjs.vercel.app/profile?uid=${uid.trim()}` : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 animate-fade-in-up space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 ring-1 ring-cyan-700/30">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.playerInfo}</h1>
          <p className="text-xs text-slate-400">Search any Free Fire player by UID</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          placeholder="Enter Free Fire UID..."
          value={uid}
          onChange={e => setUid(e.target.value.replace(/\D/g, ""))}
          required
        />
        <button
          type="submit"
          disabled={loading || !uid.trim()}
          className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={15} />}
          {t.searchPlayerBtn}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-800/40 bg-red-900/20 p-4 text-sm text-red-300">{error}</div>
      )}

      {data && basic && (
        <div className="space-y-4 animate-fade-in-up">
          {banner && (
            <div className="rounded-2xl overflow-hidden border border-blue-900/30 aspect-[16/5] relative">
              <img
                src={banner}
                alt="Profile Banner"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="font-bold text-white text-lg">{basic.nickname ?? "Player"}</p>
                <p className="text-xs text-slate-300 font-mono">{basic.accountId ?? uid}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-glass rounded-xl p-3 text-center">
              <Zap size={16} className="mx-auto text-amber-400 mb-1" />
              <p className="text-xs text-slate-500">Level</p>
              <p className="text-xl font-bold text-amber-400">{basic.level ?? "—"}</p>
            </div>
            <div className="card-glass rounded-xl p-3 text-center">
              <Heart size={16} className="mx-auto text-pink-400 mb-1" />
              <p className="text-xs text-slate-500">Likes</p>
              <p className="text-xl font-bold text-pink-400">{(basic.likes ?? basic.liked)?.toLocaleString() ?? "—"}</p>
            </div>
            <div className="card-glass rounded-xl p-3 text-center">
              <Shield size={16} className="mx-auto text-blue-400 mb-1" />
              <p className="text-xs text-slate-500">BR Rank</p>
              <p className="text-xl font-bold text-blue-400">{basic.brRankPoints ?? "—"}</p>
            </div>
            <div className="card-glass rounded-xl p-3 text-center">
              <Star size={16} className="mx-auto text-purple-400 mb-1" />
              <p className="text-xs text-slate-500">Credit</p>
              <p className="text-xl font-bold text-purple-400">{basic.creditScore ?? "—"}</p>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User size={12} /> Account Info
            </h3>
            <InfoRow label="Nickname" value={basic.nickname} color="text-white font-semibold" />
            <InfoRow label="UID" value={basic.accountId ?? uid} color="text-blue-300 font-mono" />
            <InfoRow label="Level" value={basic.level} color="text-amber-400" />
            <InfoRow label="Region" value={basic.region} />
            <InfoRow label="Likes" value={(basic.likes ?? basic.liked)?.toLocaleString()} color="text-pink-400" />
            <InfoRow label="Title" value={basic.title} />
            <InfoRow label="Season" value={basic.seasonId} />
            {data.socialInfo?.signature && <InfoRow label="Bio" value={data.socialInfo.signature} />}
          </div>

          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award size={12} /> Rank Info
            </h3>
            <InfoRow label="BR Rank Points" value={basic.brRankPoints} color="text-blue-400" />
            <InfoRow label="BR Max Rank" value={basic.brMaxRankPoints} />
            <InfoRow label="CS Rank Points" value={basic.csRankPoints} color="text-purple-400" />
            <InfoRow label="CS Max Rank" value={basic.csMaxRankPoints} />
            <InfoRow label="Credit Score" value={basic.creditScore} color="text-green-400" />
            <InfoRow label="Badge Count" value={basic.badgeCnt} />
          </div>

          {clan?.clanId && (
            <div className="card-glass rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users size={12} /> Guild Info
              </h3>
              <InfoRow label="Guild Name" value={clan.clanName} color="text-amber-400" />
              <InfoRow label="Guild ID" value={clan.clanId} color="text-slate-300 font-mono" />
              <InfoRow label="Guild Level" value={clan.clanLevel} />
              <InfoRow label="Members" value={clan.memberNum} />
            </div>
          )}

          {pet?.petId && (
            <div className="card-glass rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">🐾 Pet Info</h3>
              <InfoRow label="Pet ID" value={pet.petId} />
              <InfoRow label="Pet Level" value={pet.petLevel} color="text-rose-400" />
              <InfoRow label="Pet EXP" value={pet.petExp} />
              <InfoRow label="Active" value={pet.isSelected ? "Yes" : "No"} color={pet.isSelected ? "text-green-400" : "text-slate-400"} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
