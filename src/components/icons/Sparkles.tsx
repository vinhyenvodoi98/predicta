export function Sparkles({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="2" width="2" height="6" fill="currentColor"/>
      <rect x="11" y="16" width="2" height="6" fill="currentColor"/>
      <rect x="2" y="11" width="6" height="2" fill="currentColor"/>
      <rect x="16" y="11" width="6" height="2" fill="currentColor"/>
      <rect x="6" y="6" width="2" height="2" fill="currentColor"/>
      <rect x="16" y="6" width="2" height="2" fill="currentColor"/>
      <rect x="6" y="16" width="2" height="2" fill="currentColor"/>
      <rect x="16" y="16" width="2" height="2" fill="currentColor"/>
    </svg>
  );
}
