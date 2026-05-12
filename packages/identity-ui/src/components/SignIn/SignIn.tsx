import React, { useState } from 'react';
import type { AppearanceConfig } from '../../types/appearance';
import type { OrgAuthPolicy } from '@wegooli/identity-types';
import {
  useSignIn,
  useEmailOTP,
  usePhoneOTP,
  useMagicLink,
  usePasskey,
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
import { MFAChallenge } from '../MFAChallenge/MFAChallenge';

export interface SignInProps {
  /** Called after successful sign-in (before redirect) */
  onSuccess?: () => void;
  /** Override the post sign-in redirect URL */
  redirectUrl?: string;
  /** Organization auth policy controlling which methods to display */
  authPolicy?: OrgAuthPolicy;
  /** Theme customization */
  appearance?: AppearanceConfig;
  /**
   * 'platform' for dashboard developer signups, 'tenant' (default) for SDK end-users.
   * Plumbed through to BFF /api/auth/sign-in body.
   */
  flow?: 'platform' | 'tenant';
  /**
   * When true, render only the auth method content without surrounding card/header.
   * Defaults to false: SignIn auto-renders a self-contained branded card so SDK
   * consumers can drop `<SignIn />` standalone. Set to true when wrapping in AuthLayout.
   */
  bare?: boolean;
}

const DEFAULT_POLICY: OrgAuthPolicy = {
  allowPasskey: true,
  allowEmailOtp: true,
  allowedOauthProviders: ['google'],
  ssoEnabled: true,
};

/**
 * Renders the auth method buttons + email/OTP form.
 * Card and page chrome are provided by AuthLayout — this component only renders the inner content.
 */
export function SignIn({
  onSuccess,
  redirectUrl,
  authPolicy: authPolicyProp,
  appearance,
  flow,
  bare = false,
}: SignInProps): React.ReactElement {
  const { signIn, isLoading: ssoLoading, error: ssoError } = useSignIn();
  const { send: sendOTP, verify: verifyOTP, isLoading: otpLoading, error: otpError } = useEmailOTP();
  const { send: sendPhoneOTP, verify: verifyPhoneOTP, isLoading: phoneOtpLoading, error: phoneOtpError } = usePhoneOTP();
  const {
    send: sendMagicLink,
    isLoading: mlLoading,
    error: mlError,
    sentTo: magicLinkSentTo,
    reset: resetMagicLink,
  } = useMagicLink();
  const {
    signInWithPasskey,
    isAvailable: passkeyAvailable,
    isLoading: pkLoading,
    error: pkError,
  } = usePasskey();
  const { authPolicy: contextPolicy, isLoaded: ctxLoaded, mfaPending } = useIdentityContext();
  const authPolicy = authPolicyProp ?? contextPolicy ?? DEFAULT_POLICY;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  // Tracks whether the user opted into the magic-link flow on the email step.
  // Independent of the OTP step state — selecting magic link skips the code
  // entry entirely (the user clicks the email link instead).
  const [emailMode, setEmailMode] = useState<'otp' | 'magic_link'>('otp');

  const customProviders = authPolicy.customProviders ?? [];
  const isLoading = ssoLoading || otpLoading || phoneOtpLoading || mlLoading || pkLoading;
  const error = ssoError ?? otpError ?? phoneOtpError ?? mlError ?? pkError;

  // Identifier kind selection (Phase B). Defaults to the org's primary kind
  // when set; falls back to whatever the policy allows; finally falls back to
  // 'email' so legacy orgs without policy fields keep working unchanged.
  const allowedKinds: Array<'email' | 'phone' | 'username'> =
    authPolicy.allowedIdentifierKinds && authPolicy.allowedIdentifierKinds.length > 0
      ? authPolicy.allowedIdentifierKinds
      : ['email'];
  const initialKind: 'email' | 'phone' | 'username' =
    authPolicy.primaryIdentifierKind && allowedKinds.includes(authPolicy.primaryIdentifierKind)
      ? authPolicy.primaryIdentifierKind
      : allowedKinds[0];
  const [identifierKind, setIdentifierKind] = useState<'email' | 'phone' | 'username'>(initialKind);

  // The single input value reused across kinds — semantically email or phone
  // depending on identifierKind. Username path isn't a passwordless OTP so we
  // route those through passkey today.
  const usingPhone = identifierKind === 'phone';

  async function handleEmailSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    // Phone identifier — always OTP via SMS, no magic-link variant.
    if (usingPhone) {
      await sendPhoneOTP(email);
      setStep('otp');
      return;
    }
    if (emailMode === 'magic_link') {
      if (!authPolicy.allowMagicLink) return;
      await sendMagicLink(email, redirectUrl);
      // Stay on the email step — the inner `magicLinkSentTo` panel takes over.
      return;
    }
    if (!authPolicy.allowEmailOtp) return;
    // Both platform and tenant flows now go through the BFF's self-contained
    // email-OTP endpoints. The BFF distinguishes them via the publishable_key
    // header (set by IdentityProvider) — no the upstream IdP UI redirect for either.
    await sendOTP(email);
    setStep('otp');
  }

  async function handleOtpSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (usingPhone) {
      await verifyPhoneOTP(email, otp);
    } else {
      await verifyOTP(email, otp);
    }
    onSuccess?.();
  }

  async function handlePasskey(): Promise<void> {
    // Self-contained passkey: BFF /webauthn/auth/begin → navigator.credentials.get()
    // → /webauthn/auth/finish → session cookie + redirect. Falls back to the
    // the upstream IdP hosted UI only if WebAuthn isn't available in this browser.
    if (passkeyAvailable) {
      try {
        await signInWithPasskey();
        onSuccess?.();
        return;
      } catch {
        // Error already captured by hook; user-visible via the `error` banner.
        return;
      }
    }
    await signIn('passkey', { redirectUrl, flow });
    onSuccess?.();
  }

  async function handleOAuth(provider: string): Promise<void> {
    // Both platform and tenant flows redirect to the BFF's direct OAuth start.
    // The BFF resolves the publishable_key (sent on the query string here since
    // headers don't persist across full-page navigations) and tags the state as
    // tenant when an App is found — the upstream IdP hosted UI is bypassed in either case.
    //
    // We default the post-auth redirect to the current origin so the customer's
    // SDK app gets the user back automatically when no explicit redirectUrl prop
    // is set. Without this fallback the BFF would 302 to "/" relative to itself
    // (port 3001) and 404.
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

  // Branding from policy (publishable-key driven). Falls back to neutral defaults.
  const branding = authPolicy.branding;
  const appName = branding?.appName || appearance?.logoAlt || 'Sign in';
  const logoUrl = branding?.logoUrl || appearance?.logoUrl;
  const accentColor = branding?.primaryColor || appearance?.variables?.colorPrimary;

  const inner = (
    <div className="space-y-4" style={{ fontFamily: appearance?.variables?.fontFamily }}>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          {error.message}
        </div>
      )}

      {authPolicy.allowPasskey && passkeyAvailable && (
        <Button onClick={handlePasskey} loading={isLoading} className="w-full" iconRight={<ArrowRightIcon />}>
          Continue with Passkey
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

      {(authPolicy.allowEmailOtp || authPolicy.allowMagicLink || allowedKinds.includes('phone')) && (
        <>
          {hasUpperMethods && <Divider label="or" className="my-2" />}

          {magicLinkSentTo ? (
            // Confirmation panel after a successful magic-link send. We don't
            // know when the user actually clicks the link, so we just tell
            // them to check their inbox and offer a way back.
            <div className="space-y-3 text-center">
              <div className="text-sm text-neutral-700">
                Check your inbox — we sent a sign-in link to{' '}
                <strong className="text-neutral-900">{magicLinkSentTo}</strong>.
              </div>
              <p className="text-xs text-neutral-500">
                The link expires in 15 minutes and can be used once.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetMagicLink();
                  setEmail('');
                }}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700"
              >
                Use a different email
              </button>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-4">
              {/* Identifier-kind selector — only shown when policy allows
                  multiple kinds. With one kind it's just the input. */}
              {allowedKinds.length > 1 && (
                <div className="flex gap-1 p-0.5 bg-neutral-100 rounded-md text-xs">
                  {allowedKinds.includes('email') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifierKind('email');
                        setEmail('');
                      }}
                      className={`flex-1 py-1.5 rounded font-medium ${
                        identifierKind === 'email' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                      }`}
                    >
                      Email
                    </button>
                  )}
                  {allowedKinds.includes('phone') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifierKind('phone');
                        setEmail('');
                      }}
                      className={`flex-1 py-1.5 rounded font-medium ${
                        identifierKind === 'phone' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                      }`}
                    >
                      Phone
                    </button>
                  )}
                </div>
              )}

              <Input
                label={usingPhone ? 'Phone number' : 'Email address'}
                type={usingPhone ? 'tel' : 'email'}
                inputMode={usingPhone ? 'tel' : 'email'}
                autoComplete={usingPhone ? 'tel' : 'email'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={usingPhone ? '+82 10 1234 5678' : 'you@example.com'}
              />
              <Button type="submit" loading={isLoading} disabled={!email} className="w-full" iconRight={<ArrowRightIcon />}>
                {!usingPhone && emailMode === 'magic_link' ? 'Email me a sign-in link' : 'Continue'}
              </Button>

              {/* Magic-link mode switcher only visible when on the email tab AND
                  both methods are enabled — hidden on phone or when only one
                  email method is on. */}
              {!usingPhone && authPolicy.allowEmailOtp && authPolicy.allowMagicLink && (
                <button
                  type="button"
                  onClick={() => setEmailMode((m) => (m === 'otp' ? 'magic_link' : 'otp'))}
                  className="w-full text-sm text-neutral-500 hover:text-neutral-700"
                >
                  {emailMode === 'otp'
                    ? 'Email me a sign-in link instead →'
                    : '← Use a one-time code instead'}
                </button>
              )}
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

  // Primary auth done but session is mfa_pending — replace the auth methods
  // with the MFA challenge UI so the user can complete sign-in. We render
  // bare here so the parent's <Card>/<AuthLayout> stays consistent.
  if (mfaPending) {
    return bare ? <MFAChallenge bare onSuccess={onSuccess} /> : (
      <div
        className="min-h-[100vh] w-full bg-neutral-50 font-sans flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">
          <Card>
            <MFAChallenge bare onSuccess={onSuccess} />
          </Card>
        </div>
      </div>
    );
  }

  if (bare) {
    return inner;
  }

  // Self-contained branded card — what SDK consumers see when dropping <SignIn /> standalone.
  // Branding values come from /api/auth/policy via context; no manual props needed.
  // Wait for the policy fetch to complete before rendering so we don't flash
  // the default-policy state and then re-render with the brand-correct one.
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
            <SignInSkeleton />
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt={appName} className="h-8 w-auto" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: accentColor || '#6c47ff' }}
                    >
                      {appName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-base font-semibold text-neutral-900 truncate">{appName}</span>
                </div>
                <h1 className="text-lg font-semibold text-neutral-900">Sign in</h1>
              </div>
              {inner}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// resolveRedirect normalizes the redirect URL passed to BFF social-OAuth start.
// - undefined → current page origin (so the user comes back to where they were)
// - relative path "/foo" → joined with current origin
// - absolute URL → passed through
// Server-side / non-window contexts return whatever was given (string or '').
export function resolveRedirect(input?: string): string {
  if (typeof window === 'undefined') return input ?? '';
  if (!input) return window.location.origin + '/';
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith('/')) return window.location.origin + input;
  return input;
}

// SignInSkeleton avoids the "default policy → real policy" flash by reserving
// the same vertical space until /api/auth/policy resolves.
function SignInSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-md bg-neutral-200" />
          <div className="h-4 w-24 bg-neutral-200 rounded" />
        </div>
        <div className="h-5 w-16 bg-neutral-200 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-10 bg-neutral-100 rounded-md" />
        <div className="h-10 bg-neutral-100 rounded-md" />
        <div className="h-10 bg-neutral-100 rounded-md" />
      </div>
    </div>
  );
}
