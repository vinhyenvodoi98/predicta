export function Chart({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="6" y="14" width="3" height="4" fill="currentColor"/>
      <rect x="10" y="10" width="3" height="8" fill="currentColor"/>
      <rect x="14" y="8" width="3" height="10" fill="currentColor"/>
    </svg>
  );
}
