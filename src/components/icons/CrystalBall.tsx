export function CrystalBall({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="8" height="8" fill="currentColor"/>
      <rect x="6" y="12" width="12" height="2" fill="currentColor"/>
      <rect x="4" y="14" width="16" height="2" fill="currentColor"/>
      <rect x="6" y="16" width="12" height="2" fill="currentColor"/>
      <rect x="10" y="6" width="2" height="2" fill="white" opacity="0.5"/>
    </svg>
  );
}
