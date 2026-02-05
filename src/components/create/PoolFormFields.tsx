interface PoolFormFieldsProps {
  targetPrice: string;
  setTargetPrice: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  expiryTime: string;
  setExpiryTime: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  isCreating: boolean;
  minDate: string;
}

export function PoolFormFields({
  targetPrice,
  setTargetPrice,
  expiryDate,
  setExpiryDate,
  expiryTime,
  setExpiryTime,
  description,
  setDescription,
  isCreating,
  minDate,
}: PoolFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Target Price */}
      <div>
        <label className="text-[11px] font-bold text-zinc-900 uppercase mb-3 flex items-center gap-2">
          <span className="text-[16px]">🎯</span>
          Target Price (USD)
        </label>
        <input
          type="number"
          step="0.01"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="e.g., 50000"
          className="w-full text-[16px] px-4 py-4 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-300 bg-white font-bold"
          disabled={isCreating}
        />
        <p className="mt-2 text-[9px] text-zinc-600 bg-zinc-50 border-2 border-zinc-200 px-3 py-2">
          💡 The BTC/USD price that users will predict will be reached or exceeded
        </p>
      </div>

      {/* Expiry Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-900 uppercase mb-3 flex items-center gap-2">
            <span className="text-[16px]">📅</span>
            Expiry Date
          </label>
          <input
            type="date"
            min={minDate}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full text-[14px] px-4 py-4 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-300 bg-white font-bold"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-900 uppercase mb-3 flex items-center gap-2">
            <span className="text-[16px]">⏰</span>
            Expiry Time
          </label>
          <input
            type="time"
            value={expiryTime}
            onChange={(e) => setExpiryTime(e.target.value)}
            className="w-full text-[14px] px-4 py-4 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-300 bg-white font-bold"
            disabled={isCreating}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-bold text-zinc-900 uppercase mb-3 flex items-center gap-2">
          <span className="text-[16px]">📝</span>
          Market Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Will Bitcoin reach $50,000 by end of Q1 2025?"
          rows={4}
          maxLength={200}
          className="w-full text-[14px] px-4 py-4 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-300 bg-white font-bold resize-none"
          disabled={isCreating}
        />
        <div className="mt-2 flex justify-between items-center text-[9px] bg-zinc-50 border-2 border-zinc-200 px-3 py-2">
          <span className="text-zinc-600">💡 Be clear and specific about what you're predicting</span>
          <span
            className={`font-bold ${description.length < 10 ? "text-rose-600" : "text-emerald-600"}`}
          >
            {description.length}/200 chars
          </span>
        </div>
      </div>
    </div>
  );
}
