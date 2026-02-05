"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useCreateMarket } from "@/hooks/useCreateMarket";
import { contracts, SEPOLIA_CHAIN_ID } from "@/config/contracts";
import { PoolTypeSelector } from "@/components/create/PoolTypeSelector";
import { CreatePoolForm } from "@/components/create/CreatePoolForm";

type PoolType = "onchain" | "offchain" | null;

export default function CreatePoolPage() {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();

  const { isCreating, error, createMarket, txHash, marketAddress } = useCreateMarket(
    contracts.factory.address,
    SEPOLIA_CHAIN_ID
  );

  // Pool type selection
  const [poolType, setPoolType] = useState<PoolType>(null);

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
      if (poolType === "onchain") {
        const marketAddr = await createMarket({
          targetPrice,
          expiryTime: expiryTimestamp,
          description: description.trim(),
        });

        // Redirect to the newly created market
        setTimeout(() => {
          router.push(`/market/${marketAddr}`);
        }, 2000);
      } else {
        // Off-chain logic (to be implemented)
        setFormError("Off-chain pools are coming soon!");
      }
    } catch (err) {
      console.error("Failed to create market:", err);
    }
  };

  // Step 1: Pool Type Selection
  if (!poolType) {
    return <PoolTypeSelector onSelectType={(type) => setPoolType(type)} />;
  }

  // Step 2: Pool Creation Form
  return (
    <CreatePoolForm
      poolType={poolType}
      targetPrice={targetPrice}
      setTargetPrice={setTargetPrice}
      expiryDate={expiryDate}
      setExpiryDate={setExpiryDate}
      expiryTime={expiryTime}
      setExpiryTime={setExpiryTime}
      description={description}
      setDescription={setDescription}
      formError={formError}
      contractError={error}
      isCreating={isCreating}
      txHash={txHash || undefined}
      marketAddress={marketAddress || undefined}
      isConnected={isConnected}
      onBack={() => setPoolType(null)}
      onSubmit={handleSubmit}
    />
  );
}
