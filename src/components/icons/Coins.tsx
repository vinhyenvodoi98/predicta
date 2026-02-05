export function Coins({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front coin */}
      <rect x="11" y="8" width="8" height="2" fill="currentColor"/>
      <rect x="9" y="10" width="2" height="6" fill="currentColor"/>
      <rect x="19" y="10" width="2" height="6" fill="currentColor"/>
      <rect x="11" y="16" width="8" height="2" fill="currentColor"/>

      {/* Back coin */}
      <rect x="5" y="6" width="8" height="2" fill="currentColor" opacity="0.6"/>
      <rect x="3" y="8" width="2" height="6" fill="currentColor" opacity="0.6"/>
      <rect x="13" y="8" width="2" height="6" fill="currentColor" opacity="0.6"/>
      <rect x="5" y="14" width="8" height="2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}
