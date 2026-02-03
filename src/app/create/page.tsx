"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useCreateMarket } from "@/hooks/useCreateMarket";
import { contracts, SEPOLIA_CHAIN_ID } from "@/config/contracts";

export default function CreatePoolPage() {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();

  const { isCreating, error, createMarket, txHash, marketAddress } = useCreateMarket(
    contracts.factory.address,
    SEPOLIA_CHAIN_ID
  );

  // Form state
  const [targetPrice, setTargetPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!isConnected || !userAddress) {
      setFormError("Please connect your wallet");
      return;
    }

    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setFormError("Please enter a valid target price");
      return;
    }

    if (!expiryDate || !expiryTime) {
      setFormError("Please select expiry date and time");
      return;
    }

    if (!description || description.trim().length < 10) {
      setFormError("Please enter a description (minimum 10 characters)");
      return;
    }

    // Convert date and time to Unix timestamp
    const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`);
    const expiryTimestamp = Math.floor(expiryDateTime.getTime() / 1000);

    // Check if expiry is in the future
    if (expiryTimestamp <= Math.floor(Date.now() / 1000)) {
      setFormError("Expiry time must be in the future");
      return;
    }

    try {
      const marketAddr = await createMarket({
        targetPrice,
        expiryTime: expiryTimestamp,
        description: description.trim(),
      });

      // Redirect to the newly created market
      setTimeout(() => {
        router.push(`/market/${marketAddr}`);
      }, 2000);
    } catch (err) {
      console.error("Failed to create market:", err);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-zinc-900 mb-2 uppercase tracking-tight">
            Create Prediction Pool
          </h1>
          <p className="text-[12px] text-zinc-600">
            Create a new prediction market for BTC/USD price
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Price */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-2">
                Target Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full text-[14px] px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-indigo-200"
                disabled={isCreating}
              />
              <p className="mt-1 text-[8px] text-zinc-500">
                The BTC/USD price that users will predict will be reached or exceeded
              </p>
            </div>

            {/* Expiry Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full text-[14px] px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-2">
                  Expiry Time
                </label>
                <input
                  type="time"
                  value={expiryTime}
                  onChange={(e) => setExpiryTime(e.target.value)}
                  className="w-full text-[14px] px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-2">
                Market Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Will Bitcoin reach $50,000 by end of Q1 2025?"
                rows={4}
                maxLength={200}
                className="w-full text-[14px] px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-indigo-200 resize-none"
                disabled={isCreating}
              />
              <p className="mt-1 text-[8px] text-zinc-500">
                {description.length}/200 characters (minimum 10)
              </p>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="bg-rose-50 border-4 border-rose-600 p-4">
                <div className="text-[10px] font-bold text-rose-900 uppercase mb-1">
                  ⚠️ Error
                </div>
                <div className="text-[10px] text-rose-700">{formError}</div>
              </div>
            )}

            {/* Contract Error */}
            {error && (
              <div className="bg-rose-50 border-4 border-rose-600 p-4">
                <div className="text-[10px] font-bold text-rose-900 uppercase mb-1">
                  ⚠️ Transaction Failed
                </div>
                <div className="text-[10px] text-rose-700">{error.message}</div>
              </div>
            )}

            {/* Transaction Status */}
            {isCreating && (
              <div className="bg-blue-50 border-4 border-blue-600 p-4">
                <div className="text-[10px] font-bold text-blue-900 uppercase mb-2">
                  🔄 Creating Market...
                </div>
                {txHash && (
                  <div className="text-[8px] text-blue-700 font-mono">
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {marketAddress && (
              <div className="bg-emerald-50 border-4 border-emerald-600 p-4">
                <div className="text-[10px] font-bold text-emerald-900 uppercase mb-2">
                  ✅ Market Created Successfully!
                </div>
                <div className="text-[8px] text-emerald-700 font-mono mb-2">
                  Market Address: {marketAddress}
                </div>
                <div className="text-[8px] text-emerald-700">
                  Redirecting to market page...
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !isConnected}
              className="w-full text-[12px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 px-6 py-4 uppercase tracking-wide"
            >
              {isCreating ? "Creating Market..." : !isConnected ? "Connect Wallet to Create" : "Create Prediction Pool"}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-zinc-100 border-4 border-zinc-300 p-4">
          <div className="text-[10px] font-bold text-zinc-700 uppercase mb-2">
            ℹ️ How It Works
          </div>
          <ul className="text-[10px] text-zinc-600 space-y-1">
            <li>• Set a target price for BTC/USD</li>
            <li>• Choose when the prediction expires</li>
            <li>• Users can buy YES or NO tokens to participate</li>
            <li>• At expiry, the actual price determines the winner</li>
            <li>• Winners can redeem their tokens for payouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
