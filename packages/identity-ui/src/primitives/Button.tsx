import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const baseClass =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--brand-primary,theme(colors.primary.500))]';

// Primary uses a CSS variable so SignIn / branded surfaces can override the
// background color via inline `style={{ '--brand-primary': '#FF3030' }}`.
// Hover/active fall back to opacity tweaks so we don't need a parallel
// hover-color variable for every brand.
const variantClass: Record<Variant, string> = {
  primary: 'text-white bg-[var(--brand-primary,theme(colors.primary.500))] hover:opacity-90 active:opacity-80',
  outline: 'bg-white text-neutral-800 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
};

const sizeClass: Record<Size, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  iconLeft,
  iconRight,
  className = '',
  children,
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
  >
    {loading ? (
      <span
        aria-hidden
        className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
      />
    ) : (
      iconLeft
    )}
    <span>{children}</span>
    {!loading && iconRight}
  </button>
);
