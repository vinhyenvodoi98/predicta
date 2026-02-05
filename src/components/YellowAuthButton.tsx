"use client";

import { useState, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useYellow } from "@/contexts/YellowContext";

interface YellowAuthButtonProps {
  onAuthSuccess?: () => void;
  showStatus?: boolean;
}

export function YellowAuthButton({
  onAuthSuccess,
  showStatus = true,
}: YellowAuthButtonProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const {
    isConnected: isYellowConnected,
    isAuthenticated: isYellowAuthenticated,
    connect: connectYellow,
    authenticate: authenticateYellow,
    error: yellowError,
  } = useYellow();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<"idle" | "generating" | "requesting" | "signing" | "complete">("idle");
  const [authError, setAuthError] = useState<string | null>(null);

  // Prevent multiple simultaneous authentication attempts
  const authInProgressRef = useRef(false);

  // Manual authentication handler
  const handleManualAuth = async () => {
    // Prevent multiple simultaneous authentication attempts
    if (authInProgressRef.current || isAuthenticating) {
      console.log("[YellowAuthButton] Authentication already in progress, ignoring click");
      return;
    }

    if (!address || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    authInProgressRef.current = true;
    setIsAuthenticating(true);
    setAuthStep("generating");
    setAuthError(null);

    try {
      // Step 1: Connect to Yellow Network if not connected
      if (!isYellowConnected) {
        console.log("[YellowAuthButton] Connecting to Yellow Network...");
        setAuthStep("requesting");

        // Add timeout for connection
        const connectPromise = connectYellow();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 15000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
      }

      setAuthStep("signing");
      console.log("[YellowAuthButton] 🔐 Authenticating with Yellow Network...");

      // Step 2: Authenticate using official SDK with timeout
      const authPromise = authenticateYellow(walletClient, {
        scope: "predicta.bet",
        application: "Predicta",
        allowances: [
          { asset: "ytest.usd", amount: "1000000000" }, // 1B units = 1000 ytest.usd
        ],
        expiresInSeconds: 86400, // 24 hours (3600 = 1h, 43200 = 12h, 86400 = 24h)
      });

      const authTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout")), 15000)
      );

      await Promise.race([authPromise, authTimeoutPromise]);

      setAuthStep("complete");
      console.log("[YellowAuthButton] ✅ Authentication complete!");

      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error("[YellowAuthButton] Authentication error:", error);
      // Show user-friendly error
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          setAuthError("Connection timeout - Yellow Network may be unavailable. Please try again later.");
        } else if (error.message.includes("rejected") || error.message.includes("denied")) {
          setAuthError("Authentication rejected by user");
        } else {
          setAuthError(error.message);
        }
      } else {
        setAuthError("Authentication failed - please try again");
      }
    } finally {
      authInProgressRef.current = false;
      setIsAuthenticating(false);
      setAuthStep("idle");
    }
  };

  if (!showStatus) {
    return null;
  }

  return (
    <>
      {/* Authentication Status */}
      {isYellowAuthenticated && !isAuthenticating && (
        <div className="bg-emerald-50 border-4 border-emerald-600 p-4 mb-4">
          <div className="text-[8px] font-bold text-emerald-900 uppercase mb-2">
            ✓ Authenticated with Yellow Network
          </div>
          <div className="text-[8px] text-emerald-900">
            Ready to create channel and place bets
          </div>
        </div>
      )}

      {/* Authentication Progress */}
      {isAuthenticating && (
        <div className="bg-blue-50 border-4 border-blue-600 p-4 mb-4">
          <div className="text-[8px] font-bold text-blue-900 uppercase mb-2">
            Authenticating with Yellow Network
          </div>
          <div className="text-[8px] text-blue-900 mb-2">
            {authStep === "generating" && "⚙️ Initializing authentication..."}
            {authStep === "requesting" && "📡 Connecting to Yellow Network clearnode..."}
            {authStep === "signing" && "✍️ Please sign the authentication message in your wallet..."}
            {authStep === "complete" && "✅ Authentication complete!"}
          </div>
          {authStep === "signing" && (
            <div className="text-[7px] text-blue-700 bg-blue-100 border-2 border-blue-600 p-2 mt-2">
              ℹ️ Yellow Network requires signing an EIP-712 message for secure authentication. You may see multiple wallet prompts - this is normal.
            </div>
          )}
        </div>
      )}

      {/* Authentication Error Display */}
      {authError && !isAuthenticating && !isYellowAuthenticated && (
        <div className="bg-rose-50 border-4 border-rose-600 p-4 mb-4">
          <div className="text-[8px] font-bold text-rose-900 uppercase mb-2">
            Authentication Error
          </div>
          <div className="text-[8px] text-rose-900">
            {authError}
          </div>
          <button
            onClick={handleManualAuth}
            className="mt-2 text-[8px] font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Retry Authentication
          </button>
        </div>
      )}

      {/* Yellow Error Display */}
      {yellowError && !authError && !isAuthenticating && !isYellowAuthenticated && (
        <div className="bg-rose-50 border-4 border-rose-600 p-4 mb-4">
          <div className="text-[8px] font-bold text-rose-900 uppercase mb-2">
            Yellow Network Error
          </div>
          <div className="text-[8px] text-rose-900">
            {yellowError.message}
          </div>
          <button
            onClick={handleManualAuth}
            className="mt-2 text-[8px] font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Retry Authentication
          </button>
        </div>
      )}

      {/* Manual Auth Button */}
      {!isYellowAuthenticated && !isAuthenticating && (
        <button
          onClick={handleManualAuth}
          disabled={isAuthenticating}
          className="w-full text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 px-4 py-3 uppercase tracking-wide mb-4"
        >
          Authenticate with Yellow Network
        </button>
      )}
    </>
  );
}
