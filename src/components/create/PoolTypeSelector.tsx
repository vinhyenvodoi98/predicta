import Link from "next/link";
import { Rocket, Zap, Shield, Coins } from "@/components/icons";
import { PoolTypeCard } from "./PoolTypeCard";

type PoolType = "onchain" | "offchain";

interface PoolTypeSelectorProps {
  onSelectType: (type: PoolType) => void;
}

export function PoolTypeSelector({ onSelectType }: PoolTypeSelectorProps) {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-liner-to-b from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="text-[10px] font-bold text-white bg-black hover:bg-zinc-800 mb-6 inline-flex items-center gap-2 px-4 py-2 border-4 border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all uppercase"
          >
            <span>←</span>
            Back to Markets
          </Link>

          <div className="mt-8 inline-block bg-black border-8 border-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-8">
            <h1 className="text-[28px] md:text-[36px] font-bold text-white drop-shadow-[4px_4px_0_rgba(255,215,0,1)] uppercase tracking-wider flex items-center justify-center gap-4">
              <Rocket className="w-10 h-10 text-yellow-300" />
              Create Prediction Pool
            </h1>
          </div>
          <p className="mt-6 text-[12px] text-zinc-800 max-w-2xl mx-auto font-bold uppercase tracking-wide bg-yellow-300 inline-block px-6 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            Choose your pool type to get started
          </p>
        </div>

        {/* Pool Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <PoolTypeCard
            title="On-Chain Pool"
            description="Create a fully decentralized prediction market powered by smart contracts on Ethereum."
            icon={<Shield className="w-12 h-12 text-white" />}
            features={[
              {
                emoji: "✅",
                title: "Transparent",
                description: "All transactions visible on blockchain",
              },
              {
                emoji: "✅",
                title: "Immutable",
                description: "Rules cannot be changed after creation",
              },
              {
                emoji: "✅",
                title: "Trustless",
                description: "No intermediaries needed",
              },
            ]}
            badge={{ text: "Decentralized", color: "bg-emerald-400" }}
            cost={{
              icon: <Coins className="w-4 h-4 text-indigo-600" />,
              text: "Gas fees required",
              bgColor: "bg-indigo-100",
              borderColor: "border-indigo-600",
              textColor: "text-indigo-900",
            }}
            onClick={() => onSelectType("onchain")}
          />

          <PoolTypeCard
            title="Off-Chain Pool"
            description="Create a fast and cost-effective prediction market with centralized management."
            icon={<Zap className="w-12 h-12 text-white" />}
            features={[
              {
                emoji: "⚡",
                title: "Instant",
                description: "No blockchain confirmations needed",
              },
              {
                emoji: "⚡",
                title: "Low Cost",
                description: "No gas fees required",
              },
              {
                emoji: "⚡",
                title: "Flexible",
                description: "More customization options",
              },
            ]}
            badge={{ text: "Recommended", color: "bg-pink-400" }}
            cost={{
              icon: <Coins className="w-4 h-4 text-yellow-600" />,
              text: "No gas fees",
              bgColor: "bg-yellow-100",
              borderColor: "border-yellow-600",
              textColor: "text-yellow-900",
            }}
            onClick={() => onSelectType("offchain")}
          />
        </div>

        {/* Info Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
            <div className="text-[12px] font-bold text-zinc-900 uppercase mb-4 flex items-center gap-2">
              <span className="text-[20px]">💡</span>
              Not sure which to choose?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-zinc-700">
              <div>
                <div className="font-bold text-zinc-900 uppercase mb-2">Choose On-Chain if:</div>
                <ul className="space-y-1">
                  <li>• You want maximum transparency</li>
                  <li>• You need censorship resistance</li>
                  <li>• You're comfortable with gas fees</li>
                  <li>• You value immutability</li>
                </ul>
              </div>
              <div>
                <div className="font-bold text-zinc-900 uppercase mb-2">Choose Off-Chain if:</div>
                <ul className="space-y-1">
                  <li>• You need instant transactions</li>
                  <li>• You want to avoid gas fees</li>
                  <li>• You need more flexibility</li>
                  <li>• You're okay with trust assumptions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
