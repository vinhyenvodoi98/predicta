export function Zap({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="2" width="4" height="4" fill="currentColor"/>
      <rect x="10" y="6" width="4" height="4" fill="currentColor"/>
      <rect x="8" y="10" width="4" height="4" fill="currentColor"/>
      <rect x="6" y="14" width="8" height="2" fill="currentColor"/>
      <rect x="10" y="16" width="4" height="2" fill="currentColor"/>
      <rect x="12" y="18" width="2" height="4" fill="currentColor"/>
    </svg>
  );
}
