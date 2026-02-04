"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { useEnsName, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/config/contracts";
import { useState } from "react";

function ConnectedWalletInfo({
  account,
  chain,
  openAccountModal,
  openChainModal,
}: {
  account: any;
  chain: any;
  openAccountModal: () => void;
  openChainModal: () => void;
}) {
  const { data: ensName } = useEnsName({
    address: account.address as `0x${string}`,
  });

  const [isMinting, setIsMinting] = useState(false);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleFaucet = async () => {
    try {
      setIsMinting(true);
      writeContract({
        address: contracts.fakeUsdc.address,
        abi: contracts.fakeUsdc.abi,
        functionName: "mint",
        args: [BigInt(100) * BigInt(10) ** BigInt(6)], // 100 USDC with 6 decimals
      });
    } catch (error) {
      console.error("Faucet error:", error);
      setIsMinting(false);
    }
  };

  // Reset minting state when transaction is successful
  if (isSuccess && isMinting) {
    setTimeout(() => setIsMinting(false), 2000);
  }

  // Generate avatar background color from address
  const getAvatarColor = (address: string) => {
    const colors = [
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-rose-500",
      "bg-emerald-500",
      "bg-cyan-500",
    ];
    const index = parseInt(address.slice(2, 4), 16) % colors.length;
    return colors[index];
  };

  // Shorten address format
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayName = ensName || shortenAddress(account.address);
  const avatarText = ensName ? ensName.slice(0, 2) : account.displayName?.slice(0, 2) || "??";

  return (
    <div className="relative group">
      {/* Avatar Button */}
      <button
        className={`flex items-center justify-center w-10 h-10 ${getAvatarColor(
          account.address
        )} border-4 border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.5)] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-[10px] font-bold text-white uppercase`}
        type="button"
      >
        {avatarText}
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-4">
          {/* Address Section */}
          <div className="mb-4 pb-4 border-b-2 border-black border-dotted">
            <div className="text-[8px] font-bold text-zinc-500 uppercase mb-2">
              {ensName ? "ENS Name" : "Address"}
            </div>
            <button
              onClick={openAccountModal}
              className="text-[10px] font-bold text-zinc-900 hover:text-indigo-600 transition-colors text-left w-full"
            >
              {displayName}
            </button>
            {ensName && (
              <div className="text-[8px] text-zinc-500 mt-1">
                {shortenAddress(account.address)}
              </div>
            )}
            {account.displayBalance && (
              <div className="text-[10px] font-bold text-emerald-600 mt-2">
                {account.displayBalance}
              </div>
            )}
          </div>

          {/* Network Section */}
          <div className="mb-4 pb-4 border-b-2 border-black border-dotted">
            <div className="text-[8px] font-bold text-zinc-500 uppercase mb-2">
              Network
            </div>
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 text-[10px] font-bold text-zinc-900 hover:text-indigo-600 transition-colors w-full"
            >
              {chain.hasIcon && chain.iconUrl && (
                <img
                  alt={chain.name ?? "Chain"}
                  src={chain.iconUrl}
                  className="w-4 h-4 rounded-full border-2 border-black"
                />
              )}
              <span>{chain.name}</span>
            </button>
          </div>

          {/* Faucet Button */}
          <button
            onClick={handleFaucet}
            disabled={isPending || isConfirming || isMinting}
            className="w-full text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-3 py-2 uppercase tracking-wide"
          >
            {isPending || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isPending ? "Confirming..." : "Processing..."}
              </span>
            ) : isSuccess && isMinting ? (
              "✓ Got 100 fUSDC!"
            ) : (
              "🚰 Get 100 fUSDC"
            )}
          </button>

          {/* Disconnect Button */}
          <button
            onClick={openAccountModal}
            className="mt-3 w-full text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-3 py-2 uppercase tracking-wide"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all border-4 border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.5)] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-4 py-2 uppercase tracking-wide"
                    type="button"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all border-4 border-white shadow-[2px_2px_0_0_rgba(255,255,255,0.5)] hover:shadow-[3px_3px_0_0_rgba(255,255,255,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-4 py-2 uppercase tracking-wide"
                    type="button"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <ConnectedWalletInfo
                  account={account}
                  chain={chain}
                  openAccountModal={openAccountModal}
                  openChainModal={openChainModal}
                />
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
