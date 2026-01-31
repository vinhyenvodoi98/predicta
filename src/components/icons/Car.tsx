export function Car({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="16" height="6" fill="currentColor"/>
      <rect x="6" y="8" width="12" height="2" fill="currentColor"/>
      <rect x="2" y="14" width="4" height="4" fill="currentColor"/>
      <rect x="18" y="14" width="4" height="4" fill="currentColor"/>
      <rect x="7" y="10" width="3" height="2" fill="white" opacity="0.5"/>
      <rect x="14" y="10" width="3" height="2" fill="white" opacity="0.5"/>
    </svg>
  );
}
