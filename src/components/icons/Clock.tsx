export function Clock({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="11" y="7" width="2" height="6" fill="currentColor"/>
      <rect x="11" y="11" width="4" height="2" fill="currentColor"/>
    </svg>
  );
}
