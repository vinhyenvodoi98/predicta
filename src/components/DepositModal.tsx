"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useEnsName, useSendTransaction, useWaitForTransactionReceipt, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { useYellowBalance, formatBalanceAsUSD } from "@/hooks/useYellowBalance";
import { useYellowChannels } from "@/hooks/useYellowChannels";
import { useYellowChannel } from "@/hooks/useYellowChannel";
import { useYellow } from "@/contexts/YellowContext";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "wallet-select" | "deposit-address";

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [step, setStep] = useState<Step>("wallet-select");
  const [amount, setAmount] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
  });
  const { data: balance } = useBalance({
    address: address as `0x${string}`,
  });

  // Yellow Network client with real-time updates
  const {
    isAuthenticated: isYellowAuthenticated,
    channels: clearnodeChannels,
    balances: clearnodeBalances,
  } = useYellow();

  // Fetch channels directly from custody contract using NitroliteClient
  const { channels, isLoading: isLoadingChannel, error: channelError, refetch: refetchChannel } = useYellowChannels(
    address as `0x${string}` | undefined,
    11155111 // Sepolia chainId
  );

  // Fetch Predicta Balance from Yellow Network backend
  const { balance: yellowBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useYellowBalance(
    address as `0x${string}` | undefined
  );

  // Channel creation hook (frontend-only)
  const { isCreating: isCreatingChannelDirect, error: channelCreationError, createChannel } = useYellowChannel(
    address as `0x${string}` | undefined,
    11155111 // Sepolia
  );

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

  // Create channel (authentication is handled by YellowAuthButton)
  const handleCreateChannel = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isYellowAuthenticated) {
      alert("Please wait for authentication to complete");
      return;
    }

    setIsCreatingChannel(true);

    try {
      console.log("[DepositModal] 🚀 Creating channel with frontend NitroliteClient...");

      // Create channel directly on-chain using NitroliteClient
      const channelId = await createChannel({
        token: "0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb" as `0x${string}`, // ytest.usd
        // token: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Native ETH
        amount: "0", // Empty channel
        chainId: 11155111, // Sepolia
      });

      console.log(`[DepositModal] ✓ Channel created: ${channelId}`);

      // Refetch channels to show new channel
      await refetchChannel();

      // Go to deposit step
      setStep("deposit-address");
      alert("Channel created successfully!");
    } catch (error) {
      console.error("[DepositModal] Channel creation error:", error);
      alert(error instanceof Error ? error.message : "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // Note: Channel management (cancel/close) should be handled through
  // NitroliteClient directly when needed in the future
  // Authentication is handled by YellowAuthButton component

  // Refetch balance and channel status when deposit transaction is successful
  useEffect(() => {
    if (!isSuccess || !hash) return;

    // Delay refetch to allow on-chain state to update
    const timeoutId = setTimeout(async () => {
      console.log("[DepositModal] Transaction successful, refetching data...");

      refetchBalance();
      refetchChannel();

      setStep("wallet-select");
      setAmount("");
    }, 2000);

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, hash]); // Only run when transaction succeeds

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
          {/* Predicta Balance */}
          <div className="mb-6 bg-zinc-50 border-4 border-black p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[8px] font-bold text-zinc-500 uppercase">
                predicta balance
              </div>
              <div className="flex items-center gap-2">
                {isLoadingBalance && (
                  <div className="text-[8px] text-zinc-400">Loading...</div>
                )}
                <button
                  onClick={() => refetchBalance()}
                  disabled={isLoadingBalance}
                  className="text-[8px] font-bold text-indigo-600 hover:text-indigo-700 disabled:text-zinc-400 uppercase"
                  title="Refresh balance"
                >
                  ⟳ Refresh
                </button>
              </div>
            </div>
            <div className="text-[20px] font-bold text-zinc-900">
              {yellowBalance ? formatBalanceAsUSD(yellowBalance.total) : "$0.00"}
            </div>
            {yellowBalance && yellowBalance.breakdown.length > 0 && (
              <div className="mt-2 text-[8px] text-zinc-500">
                {yellowBalance.breakdown.map((b, i) => (
                  <div key={i}>
                    {(Number(b.amount) / 1e18).toFixed(4)} {b.tokenSymbol}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step: Wallet Select */}
          {step === "wallet-select" && (
            <div className="space-y-4">
              {isConnected && address ? (
                <>
                  {/* Check if user has channel */}
                  {isLoadingChannel ? (
                    <div className="bg-zinc-50 border-4 border-black p-4 text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">
                        Checking channel status...
                      </div>
                    </div>
                  ) : channels.length === 0 ? (
                    <>
                      <div className="text-[10px] font-bold text-zinc-900 uppercase mb-3">
                        Setup Required
                      </div>
                      <div className="bg-yellow-50 border-4 border-yellow-600 p-4 mb-4">
                        <div className="text-[8px] font-bold text-yellow-900 uppercase mb-2">
                          Channel Setup Required
                        </div>
                        <div className="text-[8px] text-yellow-900">
                          Create a balance channel with Yellow Network (one-time setup). After creation, you can deposit funds in the next step.
                        </div>
                      </div>
                      <div className="bg-white border-4 border-black p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[8px] font-bold text-zinc-500 uppercase">
                              Connected Wallet
                            </div>
                            <div className="text-[10px] font-bold text-zinc-900 mt-1">
                              {ensName || shortenAddress(address)}
                            </div>
                            {ensName && (
                              <div className="text-[8px] text-zinc-500 mt-1">
                                {shortenAddress(address)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-bold text-zinc-500 uppercase">
                              Balance
                            </div>
                            <div className="text-[12px] font-bold text-emerald-600 mt-1">
                              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0.0000 ETH"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Authentication Status Message */}
                      {!isYellowAuthenticated && (
                        <div className="bg-blue-50 border-4 border-blue-600 p-4 mb-4">
                          <div className="text-[8px] font-bold text-blue-900 uppercase mb-2">
                            🔐 Authentication Required
                          </div>
                          <div className="text-[8px] text-blue-900">
                            Please sign the authentication message to enable channel creation.
                            Authentication happens automatically when you connect your wallet.
                          </div>
                        </div>
                      )}

                      {isYellowAuthenticated && (
                        <div className="bg-emerald-50 border-4 border-emerald-600 p-4 mb-4">
                          <div className="text-[8px] font-bold text-emerald-900 uppercase mb-2">
                            ✓ Authenticated
                          </div>
                          <div className="text-[8px] text-emerald-900">
                            You're ready to create a channel
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleCreateChannel}
                        disabled={!isYellowAuthenticated || isCreatingChannel || isPending || isConfirming}
                        className="w-full text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 px-4 py-3 uppercase tracking-wide"
                      >
                        {isCreatingChannel
                          ? "Creating..."
                          : isPending
                          ? "Check Wallet..."
                          : isConfirming
                          ? "Confirming..."
                          : "Create Channel"}
                      </button>

                      {/* Info about channel creation */}
                      <div className="mt-4 text-[7px] text-zinc-500 text-center">
                        {isYellowAuthenticated
                          ? "Create a payment channel to deposit funds and place bets."
                          : "Authentication happens automatically when you connect your wallet."}
                      </div>

                      {/* Error Message */}
                      {isError && error && (
                        <div className="bg-rose-50 border-4 border-rose-600 p-3 mt-4">
                          <div className="text-[8px] font-bold text-rose-900">
                            {error.message}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] font-bold text-zinc-900 uppercase mb-3">
                        Ready to Deposit
                      </div>

                      {/* Channels from Custody Contract */}
                      {channels && channels.length > 0 && (
                        <div className="bg-linear-to-br from-emerald-50 to-teal-50 border-4 border-emerald-600 p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] font-bold text-emerald-900 uppercase">
                                🔗 Yellow Network Channels
                              </div>
                              <button
                                onClick={() => refetchChannel()}
                                className="text-[8px] font-bold text-emerald-700 hover:text-emerald-800 uppercase"
                                title="Refresh from custody contract"
                              >
                                ⟳
                              </button>
                            </div>
                            {channels.length > 0 && (
                              <div className="bg-emerald-600 text-white text-[7px] font-bold px-2 py-1 uppercase">
                                ✓ {channels.length} Active
                              </div>
                            )}
                          </div>

                          {channels.map((channel, index) => (
                            <div key={channel.channelId} className="space-y-3">
                              {/* Channel Info */}
                              <div className="bg-white border-2 border-emerald-600 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-[8px] font-bold text-emerald-700 uppercase">
                                    Channel #{index + 1}
                                  </div>
                                  <div className="text-[7px] text-emerald-600 font-mono">
                                    Chain {channel.chainId}
                                  </div>
                                </div>
                                <div className="text-[7px] text-emerald-900 font-mono break-all mb-2">
                                  {channel.channelId}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-[7px] text-emerald-700">
                                    Status: <span className="font-bold text-emerald-900">{channel.status}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Participants */}
                              <div className="bg-white/50 p-2">
                                <div className="text-[7px] font-bold text-emerald-700 uppercase mb-1">
                                  Participants
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[7px] text-emerald-900 font-mono">
                                    You: {shortenAddress(channel.participants[0])}
                                  </div>
                                  <div className="text-[7px] text-emerald-900 font-mono">
                                    Clearnode: {shortenAddress(channel.participants[1])}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Real-time Clearnode Updates */}
                      {isYellowAuthenticated && (clearnodeChannels.length > 0 || clearnodeBalances.length > 0) && (
                        <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-4 border-blue-600 p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-[10px] font-bold text-blue-900 uppercase">
                              📡 Real-time Clearnode Data
                            </div>
                            <div className="bg-blue-600 text-white text-[7px] font-bold px-2 py-1 uppercase">
                              Live
                            </div>
                          </div>

                          {/* Clearnode Channels */}
                          {clearnodeChannels.length > 0 && (
                            <div className="bg-white border-2 border-blue-600 p-3 mb-3">
                              <div className="text-[7px] font-bold text-blue-700 uppercase mb-2">
                                Channels ({clearnodeChannels.length})
                              </div>
                              <div className="space-y-1">
                                {clearnodeChannels.map((channel: any, index: number) => (
                                  <div key={index} className="text-[7px] text-blue-900">
                                    Channel {index + 1}: {JSON.stringify(channel).substring(0, 100)}...
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Clearnode Balances */}
                          {clearnodeBalances.length > 0 && (
                            <div className="bg-white border-2 border-blue-600 p-3">
                              <div className="text-[7px] font-bold text-blue-700 uppercase mb-2">
                                Balances ({clearnodeBalances.length})
                              </div>
                              <div className="space-y-1">
                                {clearnodeBalances.map((balance: any, index: number) => (
                                  <div key={index} className="text-[7px] text-blue-900 font-mono">
                                    {balance.symbol || balance.asset || 'Asset'}: {balance.amount || balance.balance || '0'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2 text-[7px] text-blue-700 text-center">
                            Updates received from Yellow Network clearnode via WebSocket
                          </div>
                        </div>
                      )}

                      <div className="bg-white border-4 border-black p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[8px] font-bold text-zinc-500 uppercase">
                              Connected Wallet
                            </div>
                            <div className="text-[10px] font-bold text-zinc-900 mt-1">
                              {ensName || shortenAddress(address)}
                            </div>
                            {ensName && (
                              <div className="text-[8px] text-zinc-500 mt-1">
                                {shortenAddress(address)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-bold text-zinc-500 uppercase">
                              Wallet Balance
                            </div>
                            <div className="text-[12px] font-bold text-emerald-600 mt-1">
                              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0.0000 ETH"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Only show Continue to Deposit for OPEN channels */}
                      {channels[0]?.status === "OPEN" && (
                        <button
                          onClick={() => setStep("deposit-address")}
                          className="w-full text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-4 py-3 uppercase tracking-wide"
                        >
                          Continue to Deposit
                        </button>
                      )}
                    </>
                  )}
                </>
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
                  {balance && (
                    <div className="text-[8px] text-zinc-500 mt-1">
                      Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
