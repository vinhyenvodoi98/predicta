export function Rocket({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="2" width="4" height="14" fill="currentColor"/>
      <rect x="6" y="8" width="4" height="4" fill="currentColor"/>
      <rect x="14" y="8" width="4" height="4" fill="currentColor"/>
      <rect x="8" y="16" width="2" height="4" fill="currentColor"/>
      <rect x="14" y="16" width="2" height="4" fill="currentColor"/>
      <rect x="11" y="5" width="2" height="2" fill="white" opacity="0.5"/>
    </svg>
  );
}
