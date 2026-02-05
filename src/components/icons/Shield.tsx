export function Shield({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="2" width="8" height="2" fill="currentColor"/>
      <rect x="6" y="4" width="2" height="10" fill="currentColor"/>
      <rect x="16" y="4" width="2" height="10" fill="currentColor"/>
      <rect x="8" y="14" width="2" height="4" fill="currentColor"/>
      <rect x="14" y="14" width="2" height="4" fill="currentColor"/>
      <rect x="10" y="18" width="4" height="2" fill="currentColor"/>
      <rect x="11" y="20" width="2" height="2" fill="currentColor"/>
      <rect x="10" y="6" width="4" height="6" fill="currentColor" opacity="0.3"/>
    </svg>
  );
}
