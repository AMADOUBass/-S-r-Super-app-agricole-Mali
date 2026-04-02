interface PrixBadgeProps {
  prixKg: number;
  unite?: string;
  className?: string;
}

export function PrixBadge({ prixKg, unite = 'FCFA/kg', className = '' }: PrixBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 bg-primary-50 border border-primary-200 text-primary-700 text-sm font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${className}`}>
      <span className="text-primary-500 text-xs">●</span>
      {prixKg.toLocaleString('fr')} {unite}
    </div>
  );
}
