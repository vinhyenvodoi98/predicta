interface StatusMessagesProps {
  formError?: string | null;
  contractError?: Error | null;
  isCreating: boolean;
  txHash?: string;
  marketAddress?: string;
}

export function StatusMessages({
  formError,
  contractError,
  isCreating,
  txHash,
  marketAddress,
}: StatusMessagesProps) {
  return (
    <>
      {/* Form Error */}
      {formError && (
        <div className="bg-rose-400 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-shake">
          <div className="text-[11px] font-bold text-black uppercase mb-1 flex items-center gap-2">
            <span className="text-[16px]">⚠️</span>
            Error
          </div>
          <div className="text-[10px] text-black font-bold">{formError}</div>
        </div>
      )}

      {/* Contract Error */}
      {contractError && (
        <div className="bg-rose-400 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="text-[11px] font-bold text-black uppercase mb-1 flex items-center gap-2">
            <span className="text-[16px]">⚠️</span>
            Transaction Failed
          </div>
          <div className="text-[10px] text-black font-bold">{contractError.message}</div>
        </div>
      )}

      {/* Transaction Status */}
      {isCreating && (
        <div className="bg-blue-300 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="text-[11px] font-bold text-black uppercase mb-2 flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Creating Market...
          </div>
          {txHash && (
            <div className="text-[9px] text-black font-mono bg-white border-2 border-black px-2 py-1">
              Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {marketAddress && (
        <div className="bg-emerald-400 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-bounce">
          <div className="text-[11px] font-bold text-black uppercase mb-2 flex items-center gap-2">
            <span className="text-[16px]">✅</span>
            Market Created Successfully!
          </div>
          <div className="text-[9px] text-black font-mono bg-white border-2 border-black px-2 py-1 mb-2">
            Market: {marketAddress.slice(0, 10)}...{marketAddress.slice(-8)}
          </div>
          <div className="text-[10px] text-black font-bold">Redirecting to market page...</div>
        </div>
      )}
    </>
  );
}
