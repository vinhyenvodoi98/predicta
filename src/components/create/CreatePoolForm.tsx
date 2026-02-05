import { FormEvent } from "react";
import { Rocket, Shield, Zap } from "@/components/icons";
import { PoolFormFields } from "./PoolFormFields";
import { StatusMessages } from "./StatusMessages";
import { PoolInfoSection } from "./PoolInfoSection";

type PoolType = "onchain" | "offchain";

interface CreatePoolFormProps {
  poolType: PoolType;
  targetPrice: string;
  setTargetPrice: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  expiryTime: string;
  setExpiryTime: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  formError: string | null;
  contractError: Error | null;
  isCreating: boolean;
  txHash?: string;
  marketAddress?: string;
  isConnected: boolean;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function CreatePoolForm({
  poolType,
  targetPrice,
  setTargetPrice,
  expiryDate,
  setExpiryDate,
  expiryTime,
  setExpiryTime,
  description,
  setDescription,
  formError,
  contractError,
  isCreating,
  txHash,
  marketAddress,
  isConnected,
  onBack,
  onSubmit,
}: CreatePoolFormProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-3xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[10px] font-bold text-white bg-black hover:bg-zinc-800 px-4 py-2 border-4 border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all uppercase"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-[24px] font-bold text-zinc-900 mb-2 uppercase tracking-tight flex items-center gap-3">
              {poolType === "onchain" ? (
                <>
                  <Shield className="w-6 h-6 text-indigo-600" />
                  Create On-Chain Pool
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 text-yellow-600" />
                  Create Off-Chain Pool
                </>
              )}
            </h1>
            <p className="text-[12px] text-zinc-600">
              Fill in the details to create your prediction market
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <PoolFormFields
              targetPrice={targetPrice}
              setTargetPrice={setTargetPrice}
              expiryDate={expiryDate}
              setExpiryDate={setExpiryDate}
              expiryTime={expiryTime}
              setExpiryTime={setExpiryTime}
              description={description}
              setDescription={setDescription}
              isCreating={isCreating}
              minDate={today}
            />

            <StatusMessages
              formError={formError}
              contractError={contractError}
              isCreating={isCreating}
              txHash={txHash}
              marketAddress={marketAddress}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !isConnected}
              className="w-full text-[14px] font-bold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-zinc-400 disabled:to-zinc-400 disabled:cursor-not-allowed transition-all border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 disabled:shadow-[6px_6px_0_0_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 px-6 py-5 uppercase tracking-wide flex items-center justify-center gap-3"
            >
              {isCreating ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Market...
                </>
              ) : !isConnected ? (
                <>Connect Wallet to Create</>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Create Prediction Pool
                </>
              )}
            </button>
          </form>
        </div>

        <PoolInfoSection />
      </div>
    </div>
  );
}
