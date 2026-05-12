import React from 'react';
import { Card } from '../../primitives/Card';

export interface AuthLayoutProps {
  /** Optional logo image URL shown above the title. */
  logoUrl?: string;
  /** Logo fallback text (used when logoUrl not provided). Default: 'Platform'. */
  logoText?: string;
  title: string;
  subtitle?: string;
  /** Footer link rendered below the card, e.g. "Already have an account? Sign in". */
  footerLink?: { prefix: string; label: string; href: string };
  /** Trust badge text rendered at the bottom (e.g. "Secured by Platform Identity"). */
  securedByLabel?: string;
  children: React.ReactNode;
}

/**
 * Centered single-column auth shell (no testimonial split).
 * Used by /sign-in and /sign-up pages of the dashboard.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  logoUrl,
  logoText = 'Platform',
  title,
  subtitle,
  footerLink,
  securedByLabel,
  children,
}) => (
  <div className="min-h-screen w-full bg-neutral-50 font-sans flex flex-col">
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex flex-col items-center mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 mb-4" />
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
                  {logoText.charAt(0).toUpperCase()}
                </div>
                <span className="text-lg font-semibold text-neutral-900">{logoText}</span>
              </div>
            )}
            <h1 className="text-xl font-semibold text-neutral-900 text-center">{title}</h1>
            {subtitle && <p className="text-sm text-neutral-500 text-center mt-1">{subtitle}</p>}
          </div>
          {children}
        </Card>

        {footerLink && (
          <p className="text-center text-sm text-neutral-500 mt-6">
            {footerLink.prefix}{' '}
            <a href={footerLink.href} className="text-primary-600 hover:text-primary-700 font-medium">
              {footerLink.label}
            </a>
          </p>
        )}

        {securedByLabel && (
          <p className="text-center text-xs text-neutral-400 mt-8">{securedByLabel}</p>
        )}
      </div>
    </main>
  </div>
);
