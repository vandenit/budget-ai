interface PayeeTooltipProps {
  cleanPayeeName: string;
  fullPayeeName?: string;
  className?: string;
}

export function PayeeTooltip({ cleanPayeeName, fullPayeeName, className = '' }: PayeeTooltipProps) {
  // Don't show tooltip if no full payee name or if it's the same as clean name
  const shouldShowTooltip = fullPayeeName &&
                           fullPayeeName.trim() !== '' &&
                           fullPayeeName !== cleanPayeeName;

  if (!shouldShowTooltip) {
    return (
      <div className={`font-semibold text-lg dark:text-white truncate ${className}`}>
        {cleanPayeeName}
      </div>
    );
  }

  return (
    <div className={`tooltip tooltip-top ${className}`} data-tip={fullPayeeName}>
      <div className="font-semibold text-lg dark:text-white truncate cursor-help">
        {cleanPayeeName}
      </div>
    </div>
  );
}
