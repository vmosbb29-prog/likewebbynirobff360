import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Home, Heart, Eye, Zap, User, List, Gift, Key } from "lucide-react";

const BOTTOM_TABS = [
  { to: "/", icon: Home, key: "home" as const },
  { to: "/like", icon: Heart, key: "like" as const },
  { to: "/auto-like", icon: Zap, key: "autoLike" as const },
  { to: "/player-info", icon: User, key: "playerInfo" as const },
  { to: "/visit", icon: Eye, key: "visit" as const },
  { to: "/price-list", icon: List, key: "priceList" as const },
  { to: "/giveaway", icon: Gift, key: "giveaway" as const },
  { to: "/check-key", icon: Key, key: "checkKey" as const },
];

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020b18" }}>
      <Navbar />
      <main className="flex-1 pb-20 md:pb-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-900/30 bg-slate-950/95 backdrop-blur-xl md:hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {BOTTOM_TABS.map(({ to, icon: Icon, key }) => {
            const active = to === "/" ? location === "/" : location.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] flex-shrink-0 transition-all duration-200",
                  active ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[9px] font-medium leading-tight whitespace-nowrap">
                  {t[key].split(" ")[0]}
                </span>
                {active && <span className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="hidden md:block border-t border-blue-900/20 py-6 text-center text-xs text-slate-600">
        <p>
          © 2025 Like By Nirob — by{" "}
          <a href="https://t.me/NIROBFF360" target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-400">
            @NIROBFF360
          </a>
        </p>
        <div className="mt-1 flex justify-center gap-4">
          <a href="https://t.me/likebynirob" target="_blank" rel="noopener" className="hover:text-slate-400">Channel</a>
          <a href="https://t.me/likebynirobgp" target="_blank" rel="noopener" className="hover:text-slate-400">Group</a>
        </div>
      </footer>
    </div>
  );
}
