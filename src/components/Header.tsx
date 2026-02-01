"use client";

import { useState } from "react";
import Link from "next/link";
import { CrystalBall, Chart, Briefcase, Sparkles, Money } from "./icons";
import { ConnectButton } from "./ConnectButton";
import { DepositModal } from "./DepositModal";
import { YellowAuthButton } from "./YellowAuthButton";

export function Header() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  return (
    <>
      <header className="border-b-8 border-black shadow-[0_8px_0_0_rgba(0,0,0,1)] sticky top-0 z-40 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <CrystalBall className="w-5 h-5 text-white" />
              <h1 className="text-[14px] font-bold text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover:drop-shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all uppercase">
                Predicta
              </h1>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="text-[10px] font-bold text-white hover:text-yellow-300 transition-all px-3 py-2 border-2 border-transparent hover:border-white uppercase tracking-wide flex items-center gap-2"
              >
                <Chart className="w-4 h-4" />
                Markets
              </Link>
              <Link
                href="/portfolio"
                className="text-[10px] font-bold text-white hover:text-yellow-300 transition-all px-3 py-2 border-2 border-transparent hover:border-white uppercase tracking-wide flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Portfolio
              </Link>
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all border-4 border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.5)] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-4 py-2 uppercase tracking-wide flex items-center gap-2"
              >
                <Money className="w-4 h-4" />
                Deposit
              </button>
              <Link
                href="/create"
                className="text-[10px] font-bold text-white bg-black hover:bg-zinc-800 transition-all border-4 border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.5)] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-4 py-2 uppercase tracking-wide flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Create
              </Link>
              <ConnectButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Global Yellow Network Authentication */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <YellowAuthButton showStatus={true} />
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </>
  );
}
