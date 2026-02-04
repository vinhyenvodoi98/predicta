"use client";

import { useState } from "react";
import { useAccount, useBalance, useEnsName, useSendTransaction, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, formatUnits } from "viem";
import { contracts } from "@/config/contracts";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "wallet-select" | "deposit-address";

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [step, setStep] = useState<Step>("wallet-select");
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
  });
  const { data: balance } = useBalance({
    address: address as `0x${string}`,
  });

  // Get USDC balance
  const { data: usdcBalance } = useReadContract({
    address: contracts.fakeUsdc.address,
    abi: contracts.fakeUsdc.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Format USDC balance (6 decimals)
  const formattedUsdcBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toFixed(2)
    : "0.00";

  // Placeholder for deposit address (will be updated later)
  const DEPOSIT_ADDRESS = "0x0000000000000000000000000000000000000000";

  const { data: hash, sendTransaction, isPending, isError, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleBack = () => {
    if (step === "deposit-address") {
      setStep("wallet-select");
    }
  };

  const handleClose = () => {
    setStep("wallet-select");
    setAmount("");
    onClose();
  };

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    sendTransaction({
      to: DEPOSIT_ADDRESS as `0x${string}`,
      value: parseEther(amount),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="border-b-4 border-black bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="flex items-center justify-between">
            {step === "deposit-address" && (
              <button
                onClick={handleBack}
                className="text-[10px] font-bold text-white hover:text-yellow-300 uppercase"
              >
                ← Back
              </button>
            )}
            {step === "wallet-select" && <div />}
            <h2 className="text-[14px] font-bold text-white uppercase">
              Deposit
            </h2>
            <button
              onClick={handleClose}
              className="text-[14px] font-bold text-white hover:text-yellow-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* FakeUSDC Balance */}
          <div className="mb-6 bg-emerald-50 border-4 border-emerald-600 p-4">
            <div className="text-[8px] font-bold text-emerald-700 uppercase mb-2">
              FakeUSDC Balance
            </div>
            <div className="text-[20px] font-bold text-emerald-900">
              {formattedUsdcBalance} fUSDC
            </div>
            <div className="text-[8px] text-emerald-600 mt-1">
              Testnet currency for prediction markets
            </div>
          </div>

          {/* Step: Wallet Select */}
          {step === "wallet-select" && (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-zinc-900 uppercase mb-3">
                Select Wallet to Deposit
              </div>

              {isConnected && address ? (
                <button
                  onClick={() => setStep("deposit-address")}
                  className="w-full bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-zinc-900">
                        {ensName || shortenAddress(address)}
                      </div>
                      {ensName && (
                        <div className="text-[8px] text-zinc-500 mt-1">
                          {shortenAddress(address)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-bold text-emerald-600">
                        {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0.0000 ETH"}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 mt-1">
                        {formattedUsdcBalance} fUSDC
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="bg-rose-50 border-4 border-rose-600 p-4">
                  <div className="text-[10px] font-bold text-rose-900 uppercase">
                    Please connect your wallet first
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Deposit Address */}
          {step === "deposit-address" && (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-zinc-900 uppercase mb-3">
                Deposit ETH
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="text-[8px] font-bold text-zinc-500 uppercase">
                  Amount (ETH)
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  placeholder="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border-4 border-black px-4 py-3 text-[12px] font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-600"
                />
                {balance && (
                  <div className="text-[8px] text-zinc-500">
                    Available: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </div>
                )}
              </div>

              {/* Deposit Button */}
              <button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0 || isPending || isConfirming}
                className="w-full text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 px-4 py-3 uppercase tracking-wide"
              >
                {isPending ? "Check Wallet..." : isConfirming ? "Confirming..." : isSuccess ? "Success!" : "Deposit"}
              </button>

              {/* Error Message */}
              {isError && error && (
                <div className="bg-rose-50 border-4 border-rose-600 p-3">
                  <div className="text-[8px] font-bold text-rose-900">
                    {error.message}
                  </div>
                </div>
              )}

              {/* Deposit Address */}
              <div className="bg-zinc-50 border-4 border-black p-4">
                <div className="text-[8px] font-bold text-zinc-500 uppercase mb-2">
                  Deposit Address
                </div>
                <div className="text-[10px] font-bold text-zinc-900 break-all font-mono">
                  {DEPOSIT_ADDRESS}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
                  }}
                  className="mt-3 text-[8px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                >
                  Copy Address
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border-4 border-yellow-600 p-4">
                <div className="text-[8px] font-bold text-yellow-900 uppercase mb-2">
                  Important
                </div>
                <ul className="text-[8px] text-yellow-900 space-y-1 list-disc list-inside">
                  <li>Only send ETH to this address</li>
                  <li>Funds will appear in your Predicta balance</li>
                  <li>Minimum deposit: 0.01 ETH</li>
                </ul>
              </div>

              {/* Wallet Info */}
              {isConnected && address && (
                <div className="border-t-4 border-black border-dotted pt-4">
                  <div className="text-[8px] font-bold text-zinc-500 uppercase mb-2">
                    Sending from
                  </div>
                  <div className="text-[10px] font-bold text-zinc-900">
                    {ensName || shortenAddress(address)}
                  </div>
                  <div className="mt-2 space-y-1">
                    {balance && (
                      <div className="text-[8px] text-zinc-500">
                        ETH: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                      </div>
                    )}
                    <div className="text-[8px] text-emerald-600 font-bold">
                      fUSDC: {formattedUsdcBalance}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
