export function Lightbulb({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="8" height="10" fill="currentColor"/>
      <rect x="9" y="14" width="6" height="2" fill="currentColor"/>
      <rect x="10" y="16" width="4" height="4" fill="currentColor"/>
      <rect x="10" y="7" width="2" height="2" fill="white" opacity="0.7"/>
    </svg>
  );
}
