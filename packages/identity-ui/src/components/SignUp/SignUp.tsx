import React, { useState } from 'react';
import type { AppearanceConfig } from '../../types/appearance';
import type { OrgAuthPolicy } from '@wegooli/identity-types';
import {
  useSignIn,
  useEmailOTP,
  useIdentityContext,
  readBffBaseUrl,
  readPublishableKey,
} from '@wegooli/identity-react';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Divider } from '../../primitives/Divider';
import { SocialButton } from '../../primitives/SocialButton';
import { ArrowRightIcon } from '../../primitives/icons';
import { Card } from '../../primitives/Card';
import { resolveRedirect } from '../SignIn/SignIn';

export interface SignUpProps {
  onSuccess?: () => void;
  redirectUrl?: string;
  authPolicy?: OrgAuthPolicy;
  appearance?: AppearanceConfig;
  /** 'platform' or 'tenant' (default). See SignIn for semantics. */
  flow?: 'platform' | 'tenant';
  /** Render only inner content (no card chrome). Default false → branded card auto-rendered. */
  bare?: boolean;
}

const DEFAULT_POLICY: OrgAuthPolicy = {
  allowPasskey: true,
  allowEmailOtp: true,
  allowedOauthProviders: ['google'],
  ssoEnabled: true,
};

/**
 * Sign-up flow content (no card chrome — wrap in AuthLayout).
 * Since the platform uses OTP/social/passkey only (no password), sign-up is
 * effectively the same flow as sign-in. the upstream IdP provisions the user on first
 * authentication; the BFF callback creates platform_user or tenant user based on `flow`.
 */
export function SignUp({
  onSuccess,
  redirectUrl,
  authPolicy: authPolicyProp,
  appearance,
  flow,
  bare = false,
}: SignUpProps): React.ReactElement {
  const { signIn, isLoading: ssoLoading, error: ssoError } = useSignIn();
  const { send: sendOTP, verify: verifyOTP, isLoading: otpLoading, error: otpError } = useEmailOTP();
  const { authPolicy: contextPolicy, isLoaded: ctxLoaded } = useIdentityContext();
  const authPolicy = authPolicyProp ?? contextPolicy ?? DEFAULT_POLICY;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const customProviders = authPolicy.customProviders ?? [];
  const isLoading = ssoLoading || otpLoading;
  const error = ssoError ?? otpError;

  async function handleEmailSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!authPolicy.allowEmailOtp) return;
    await sendOTP(email);
    setStep('otp');
  }
  async function handleOtpSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await verifyOTP(email, otp);
    onSuccess?.();
  }
  async function handlePasskey(): Promise<void> {
    await signIn('passkey', { redirectUrl, flow });
    onSuccess?.();
  }
  async function handleOAuth(provider: string): Promise<void> {
    const dest = resolveRedirect(redirectUrl);
    const params = new URLSearchParams();
    if (dest) params.set('redirectUrl', dest);
    const pk = readPublishableKey();
    if (pk) params.set('publishableKey', pk);
    const qs = params.toString();
    const base = `/api/auth/social/${encodeURIComponent(provider)}/start`;
    const bffBase = readBffBaseUrl();
    window.location.href = `${bffBase}${base}${qs ? `?${qs}` : ''}`;
  }

  const hasUpperMethods = authPolicy.allowPasskey || authPolicy.allowedOauthProviders.length > 0 || customProviders.length > 0;

  const branding = authPolicy.branding;
  const appName = branding?.appName || appearance?.logoAlt || 'Create your account';
  const logoUrl = branding?.logoUrl || appearance?.logoUrl;
  const accentColor = branding?.primaryColor || appearance?.variables?.colorPrimary;

  const inner = (
    <div className="space-y-4" style={{ fontFamily: appearance?.variables?.fontFamily }}>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          {error.message}
        </div>
      )}

      {authPolicy.allowPasskey && (
        <Button onClick={handlePasskey} loading={isLoading} className="w-full" iconRight={<ArrowRightIcon />}>
          Sign up with Passkey
        </Button>
      )}

      {(authPolicy.allowedOauthProviders.length > 0 || customProviders.length > 0) && (
        <div className="grid grid-cols-1 gap-2">
          {authPolicy.allowedOauthProviders.map((provider) => (
            <SocialButton
              key={provider}
              provider={provider}
              onClick={() => void handleOAuth(provider)}
              disabled={isLoading}
              className="w-full"
            />
          ))}
          {customProviders.map((p) => (
            <SocialButton
              key={p.key}
              provider={p.key}
              label={`Continue with ${p.name}`}
              iconUrl={p.iconUrl}
              onClick={() => void handleOAuth(p.key)}
              disabled={isLoading}
              className="w-full"
            />
          ))}
        </div>
      )}

      {authPolicy.allowEmailOtp && (
        <>
          {hasUpperMethods && <Divider label="or" className="my-2" />}

          {step === 'email' ? (
            <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" loading={isLoading} disabled={!email} className="w-full" iconRight={<ArrowRightIcon />}>
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleOtpSubmit(e)} className="space-y-4">
              <p className="text-sm text-neutral-600">
                Enter the one-time code sent to <strong className="text-neutral-900">{email}</strong>.
              </p>
              <Input
                label="One-time code"
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
              <Button type="submit" loading={isLoading} disabled={!otp} className="w-full" iconRight={<ArrowRightIcon />}>
                Verify Code
              </Button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700"
              >
                Use a different email
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );

  if (bare) {
    return inner;
  }

  const cardStyle = accentColor
    ? ({ ['--brand-primary' as string]: accentColor } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="min-h-[100vh] w-full bg-neutral-50 font-sans flex items-center justify-center px-4 py-12"
      style={cardStyle}
    >
      <div className="w-full max-w-md">
        <Card>
          {!ctxLoaded ? (
            <div className="animate-pulse">
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-md bg-neutral-200" />
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                </div>
                <div className="h-5 w-32 bg-neutral-200 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-10 bg-neutral-100 rounded-md" />
                <div className="h-10 bg-neutral-100 rounded-md" />
                <div className="h-10 bg-neutral-100 rounded-md" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt={branding?.appName || 'Logo'} className="h-8 w-auto" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: accentColor || '#6c47ff' }}
                    >
                      {(branding?.appName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {branding?.appName && (
                    <span className="text-base font-semibold text-neutral-900 truncate">{branding.appName}</span>
                  )}
                </div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {appName === branding?.appName ? 'Create your account' : appName}
                </h1>
              </div>
              {inner}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
