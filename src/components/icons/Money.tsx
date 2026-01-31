export function Money({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="4" width="2" height="3" fill="currentColor"/>
      <rect x="8" y="7" width="8" height="2" fill="currentColor"/>
      <rect x="9" y="9" width="6" height="2" fill="currentColor"/>
      <rect x="10" y="11" width="4" height="2" fill="currentColor"/>
      <rect x="9" y="13" width="6" height="2" fill="currentColor"/>
      <rect x="8" y="15" width="8" height="2" fill="currentColor"/>
      <rect x="11" y="17" width="2" height="3" fill="currentColor"/>
    </svg>
  );
}
