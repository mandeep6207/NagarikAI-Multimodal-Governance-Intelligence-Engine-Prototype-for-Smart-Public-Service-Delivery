export default function Emblem({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index * 30 * Math.PI) / 180;
        const x2 = 32 + Math.cos(angle) * 23;
        const y2 = 32 + Math.sin(angle) * 23;
        const x1 = 32 + Math.cos(angle) * 10;
        const y1 = 32 + Math.sin(angle) * 10;
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />;
      })}
    </svg>
  );
}
