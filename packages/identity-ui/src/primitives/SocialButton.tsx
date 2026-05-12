import React from 'react';
import { Button, type ButtonProps } from './Button';
import { GithubIcon, GoogleIcon, ProviderInitialIcon } from './icons';

export interface SocialButtonProps extends Omit<ButtonProps, 'variant' | 'iconLeft'> {
  /** Provider identifier — built-ins: 'github', 'google'. Anything else falls back to a generic initial icon. */
  provider: string;
  /** Optional icon URL for custom providers (preferred over initial fallback). */
  iconUrl?: string;
  /** Display label, e.g. "Continue with GitHub". If omitted, shows the provider name capitalized. */
  label?: string;
}

const builtinIcons: Record<string, React.FC<{ size?: number }>> = {
  github: GithubIcon,
  google: GoogleIcon,
};

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  iconUrl,
  label,
  children,
  ...rest
}) => {
  const Built = builtinIcons[provider.toLowerCase()];
  const text = children ?? label ?? `Continue with ${capitalize(provider)}`;

  let icon: React.ReactNode;
  if (iconUrl) {
    icon = <img src={iconUrl} alt="" width={18} height={18} className="rounded-sm" />;
  } else if (Built) {
    icon = <Built size={18} />;
  } else {
    icon = <ProviderInitialIcon name={provider} size={18} />;
  }

  return (
    <Button {...rest} variant="outline" iconLeft={icon}>
      {text}
    </Button>
  );
};

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
