export function Dice({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="white"/>
      <rect x="8" y="8" width="2" height="2" fill="currentColor"/>
      <rect x="14" y="8" width="2" height="2" fill="currentColor"/>
      <rect x="11" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="8" y="14" width="2" height="2" fill="currentColor"/>
      <rect x="14" y="14" width="2" height="2" fill="currentColor"/>
    </svg>
  );
}
