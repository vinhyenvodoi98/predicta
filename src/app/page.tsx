import { markets } from "@/data/markets";
import { MarketCard } from "@/components/MarketCard";
import { CrystalBall } from "@/components/icons";

export default function Home() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center relative">
          <div className="inline-block bg-black border-8 border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 mb-6">
            <h1 className="text-[20px] md:text-[24px] font-bold text-white drop-shadow-[3px_3px_0_rgba(255,215,0,1)] uppercase tracking-wider flex items-center justify-center gap-3">
              <CrystalBall className="w-8 h-8" />
              Prediction Markets
            </h1>
          </div>
          <p className="text-[10px] text-zinc-800 max-w-2xl mx-auto font-bold uppercase tracking-wide bg-yellow-300 inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            Make predictions • Win rewards • Have fun!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </div>
    </div>
  );
}
