export function Briefcase({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="16" height="10" fill="currentColor"/>
      <rect x="8" y="6" width="8" height="4" fill="currentColor"/>
      <rect x="10" y="12" width="4" height="2" fill="white" opacity="0.5"/>
    </svg>
  );
}
