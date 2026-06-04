import { useEffect, useState } from "react";
import { List, Heart, Eye, Zap } from "lucide-react";

interface PriceItem { label: string; price: string; description?: string; }
interface PriceData {
  currency: string;
  contactInfo: string;
  likeItems: PriceItem[];
  visitItems: PriceItem[];
  autoLikeItems?: PriceItem[];
}

const DEFAULT_PRICES: PriceData = {
  currency: "৳",
  contactInfo: "Contact: @NIROBFF360",
  likeItems: [],
  visitItems: [],
  autoLikeItems: [],
};

function PriceCard({ item }: { item: PriceItem }) {
  return (
    <div className="card-glass rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-white text-sm">{item.label}</p>
        {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
      </div>
      <span className="text-lg font-bold text-blue-400">{item.price}</span>
    </div>
  );
}

export default function PriceList() {
  const [prices, setPrices] = useState<PriceData>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/price-list")
      .then(r => r.json())
      .then(data => { if (data?.likeItems) setPrices(data as PriceData); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const autoLikeItems = prices.autoLikeItems ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 animate-fade-in-up">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600/20 text-green-400 ring-1 ring-green-700/30">
          <List size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Price List</h1>
          <p className="text-xs text-slate-400">{prices.contactInfo}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="animate-spin h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} className="text-pink-400" />
                <h2 className="font-semibold text-white text-sm">Like Service</h2>
              </div>
              {prices.likeItems.length === 0 ? (
                <p className="text-slate-500 text-sm">No prices configured yet.</p>
              ) : prices.likeItems.map((item, i) => <PriceCard key={i} item={item} />)}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={16} className="text-purple-400" />
                <h2 className="font-semibold text-white text-sm">Visit Service</h2>
              </div>
              {prices.visitItems.length === 0 ? (
                <p className="text-slate-500 text-sm">No prices configured yet.</p>
              ) : prices.visitItems.map((item, i) => <PriceCard key={i} item={item} />)}
            </div>
          </div>
          {autoLikeItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-amber-400" />
                <h2 className="font-semibold text-white text-sm">Auto Like Service</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {autoLikeItems.map((item, i) => <PriceCard key={i} item={item} />)}
              </div>
            </div>
          )}
          <div className="card-glass rounded-2xl p-6 text-center border-blue-900/20">
            <p className="text-white font-semibold text-sm mb-1">Ready to buy?</p>
            <p className="text-slate-400 text-xs mb-4">Contact us on Telegram for instant delivery</p>
            <a href="https://t.me/NIROBFF360" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-all">
              Contact @NIROBFF360
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
