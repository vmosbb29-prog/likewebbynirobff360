import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import {
  Heart, Eye, Zap, Key, User, Gift, ShoppingBag,
  CheckCircle, ChevronRight, Send, Star, Shield
} from "lucide-react";

const STEPS = [
  { n: "01", title: "Get a Key", desc: "Purchase an access key from our Telegram. Keys are available for Like, Visit, or Both.", icon: ShoppingBag, color: "text-amber-400", bg: "bg-amber-600/10 border-amber-700/30" },
  { n: "02", title: "Open Like/Visit", desc: "Go to the Like or Visit tab from the bottom menu below.", icon: Heart, color: "text-pink-400", bg: "bg-pink-600/10 border-pink-700/30" },
  { n: "03", title: "Enter Details", desc: "Enter your Free Fire UID, select your region, and paste your key.", icon: Key, color: "text-blue-400", bg: "bg-blue-600/10 border-blue-700/30" },
  { n: "04", title: "Send & Done!", desc: "Click Send and your likes/visits will be delivered instantly.", icon: CheckCircle, color: "text-green-400", bg: "bg-green-600/10 border-green-700/30" },
];

const FEATURES = [
  { icon: Heart, label: "Like Service", desc: "Send instant likes to any FF account", color: "text-pink-400", to: "/like" },
  { icon: Eye, label: "Visit Service", desc: "Boost your profile visit count", color: "text-purple-400", to: "/visit" },
  { icon: Zap, label: "Auto Like", desc: "Daily automatic likes — set and forget", color: "text-amber-400", to: "/auto-like" },
  { icon: User, label: "Player Info", desc: "View detailed player stats by UID", color: "text-cyan-400", to: "/player-info" },
  { icon: Gift, label: "Giveaway", desc: "Free likes during giveaway events", color: "text-rose-400", to: "/giveaway" },
  { icon: Key, label: "Key Checker", desc: "Check your key status & validity", color: "text-amber-400", to: "/check-key" },
];

const HOW_TO_BUY = [
  "Open Telegram and search @NIROBFF360",
  "Message 'I want a key' or '/buy'",
  "Select key type: Like, Visit, or Both",
  "Pay via bKash / Nagad / Rocket",
  "Receive your key instantly after payment",
];

export default function Home() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in-up space-y-12">
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 ring-2 ring-blue-500/30 animate-pulse-glow">
          <Heart size={30} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-black gradient-text">Like By Nirob</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">{t.heroSub}</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/like" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            <Heart size={15} /> Send Like
          </Link>
          <Link href="/giveaway" className="inline-flex items-center gap-2 rounded-xl border border-rose-700/40 bg-rose-900/20 px-5 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-900/30 transition-all">
            <Gift size={15} /> Free Giveaway
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-px flex-1 bg-blue-900/40" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest px-3">How To Use</h2>
          <div className="h-px flex-1 bg-blue-900/40" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {STEPS.map((step) => (
            <div key={step.n} className={`card-glass rounded-2xl p-5 border ${step.bg} flex gap-4`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${step.bg}`}>
                <step.icon size={18} className={step.color} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-600">{step.n}</span>
                  <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-px flex-1 bg-blue-900/40" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest px-3">All Features</h2>
          <div className="h-px flex-1 bg-blue-900/40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc, color, to }) => (
            <Link
              key={to}
              href={to}
              className="card-glass rounded-xl p-4 hover:border-blue-700/40 hover:bg-blue-950/30 transition-all group"
            >
              <Icon size={22} className={`${color} mb-2`} />
              <p className="font-semibold text-white text-sm mb-0.5">{label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card-glass rounded-2xl p-6 border-blue-800/30 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/20 ring-1 ring-amber-700/30">
            <ShoppingBag size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">How To Buy a Key</h2>
            <p className="text-xs text-slate-500">Simple steps to get your access key</p>
          </div>
        </div>
        <ol className="space-y-2">
          {HOW_TO_BUY.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">{i + 1}</span>
              <span className="text-slate-300">{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-3 pt-2">
          <a
            href="https://t.me/NIROBFF360"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-all"
          >
            <Send size={14} /> Buy on Telegram
          </a>
          <Link
            href="/price-list"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-800/40 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-300 hover:text-white transition-all"
          >
            View Prices
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Shield, label: "100% Safe", desc: "No account risk, no login required", color: "text-green-400" },
          { icon: Star, label: "Instant Delivery", desc: "Likes delivered within seconds", color: "text-amber-400" },
          { icon: Zap, label: "24/7 Active", desc: "Auto-like runs every day at 4AM", color: "text-blue-400" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="card-glass rounded-xl p-4 text-center">
            <Icon size={22} className={`${color} mx-auto mb-2`} />
            <p className="font-semibold text-white text-sm">{label}</p>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
