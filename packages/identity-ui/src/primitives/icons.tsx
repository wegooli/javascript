import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const baseProps = (size: number, rest: React.SVGProps<SVGSVGElement>): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  ...rest,
});

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 16, ...rest }) => (
  <svg {...baseProps(size, rest)}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const GithubIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

export const GoogleIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export const ProviderInitialIcon: React.FC<IconProps & { name: string }> = ({ name, size = 18, ...rest }) => {
  const initial = (name?.[0] ?? '?').toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0.12" />
      <text x="12" y="16" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
        {initial}
      </text>
    </svg>
  );
};
