import React from 'react';

export interface DividerProps {
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ label, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`} role="separator">
    <span className="flex-1 h-px bg-neutral-200" />
    {label && <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{label}</span>}
    <span className="flex-1 h-px bg-neutral-200" />
  </div>
);
