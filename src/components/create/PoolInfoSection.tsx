export function PoolInfoSection() {
  return (
    <div className="mt-6 bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-6">
      <div className="text-[11px] font-bold text-zinc-900 uppercase mb-3 flex items-center gap-2">
        <span className="text-[20px]">ℹ️</span>
        How It Works
      </div>
      <ul className="text-[10px] text-zinc-700 space-y-2">
        <li className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">1.</span>
          <span>Set a target price for BTC/USD and expiry time</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">2.</span>
          <span>Users buy YES tokens (price will reach target) or NO tokens (price won't reach)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">3.</span>
          <span>Prices adjust automatically based on LMSR (Logarithmic Market Scoring Rule)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">4.</span>
          <span>At expiry, Chainlink oracle provides the actual BTC price</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">5.</span>
          <span>Winners redeem their tokens for proportional payouts</span>
        </li>
      </ul>
    </div>
  );
}
