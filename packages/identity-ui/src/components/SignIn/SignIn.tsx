import React, { useEffect, useState } from 'react';
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
  generatePKCEChallenge,
  readLastMethod,
  rememberLastMethod,
  stashPendingMethod,
  oauthMethod,
} from '@wegooli/identity-react';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Divider } from '../../primitives/Divider';
import { SocialButton } from '../../primitives/SocialButton';
import { ArrowRightIcon } from '../../primitives/icons';
import { Card } from '../../primitives/Card';
import { ErrorBanner } from '../../primitives/ErrorBanner';
import { MFAChallenge } from '../MFAChallenge/MFAChallenge';
import { useAuthLabels } from '../../i18n';
import type { LocalizableProps } from '../../i18n/types';

export interface SignInProps extends LocalizableProps {
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
  /**
   * 로그인 수단을 **어떤 차례로** 보여 줄 것인가.
   *
   *   passkey-first (기본)  패스키 · 소셜 → 구분선 → 이메일
   *   email-first           이메일 → 「이미 등록하셨다면」 → 패스키 · 소셜
   *
   * 기본값은 지금까지의 차례 그대로다 — 이 값을 안 주는 앱은 아무것도
   * 안 바뀐다.
   *
   * `email-first` 를 쓰는 앱이 있는 이유: **계정이 초대로만 생기는 서비스**에서는
   * 처음 오는 사람이 거의 전부 이메일로 들어온다. 패스키는 한 번 로그인한
   * 뒤에야 만들 수 있으므로, 맨 위의 가장 큰 버튼이 **아직 못 쓰는 수단**이 된다.
   */
  methodOrder?: 'passkey-first' | 'email-first';
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
  methodOrder = 'passkey-first',
  locale,
  labels: labelOverrides,
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
  // 문구. prop 으로 넘긴 언어 → 앱 설정에 적힌 언어 → 한국어 순으로 정해진다.
  const L = useAuthLabels(locale, labelOverrides, authPolicy);
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

  // Which method this browser used last time. It lives in the browser only, so
  // it is read after mount — a server-rendered first paint has no hint, and the
  // markup can't disagree with what the server produced.
  const [lastMethod, setLastMethod] = useState<string | null>(null);
  useEffect(() => {
    setLastMethod(readLastMethod());
  }, []);

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
      stashPendingMethod('magic_link');
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
      rememberLastMethod('phone_otp');
    } else {
      await verifyOTP(email, otp);
      rememberLastMethod('email_otp');
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
        rememberLastMethod('passkey');
        onSuccess?.();
        return;
      } catch {
        // Error already captured by hook; user-visible via the `error` banner.
        return;
      }
    }
    // Redirect path: we only know the intent here. It becomes "last used" when
    // the callback confirms the sign-in actually completed.
    stashPendingMethod('passkey');
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
    // Attach PKCE challenge so the BFF callback can issue a one-time `?code=`
    // instead of the legacy `#access_token=` fragment. The verifier is stashed
    // in sessionStorage and consumed by IdentityProvider's handleOAuthCallback
    // when the IdP redirects back. Falling back silently if Web Crypto is
    // unavailable (very old browsers / non-secure contexts) — the BFF still
    // supports the fragment surface for those clients.
    try {
      const challenge = await generatePKCEChallenge();
      params.set('code_challenge', challenge);
      params.set('code_challenge_method', 'S256');
    } catch {
      /* fall back to fragment flow */
    }
    // The page is about to leave. Note which button was pressed; the callback
    // promotes it to "last used" only if the round trip succeeds, so a
    // cancelled provider screen leaves no mark.
    stashPendingMethod(oauthMethod(provider));
    const qs = params.toString();
    const base = `/api/auth/social/${encodeURIComponent(provider)}/start`;
    const bffBase = readBffBaseUrl();
    window.location.href = `${bffBase}${base}${qs ? `?${qs}` : ''}`;
  }

  /**
   * "Last used" marker. Sits on the button's top edge so it reads as a note
   * about that button without stealing the button's own label. Decorative for
   * sighted users, announced for screen readers via the button's aria-describedby
   * would need an id per button — the visually-hidden text inside is simpler and
   * reads in order: "Google. Last used."
   */
  function LastUsed({ on }: { on: boolean }): React.ReactElement | null {
    if (!on) return null;
    return (
      <span className="pointer-events-none absolute -top-2 right-3 z-10 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium leading-none text-neutral-500 shadow-sm">
        {L.common.lastUsed}
      </span>
    );
  }

  /**
   * Compact marker for the identifier tabs. A full pill would not fit in a
   * segmented control, so the remembered tab gets a dot — the pill on the
   * button below still spells out what it means once the tab is selected.
   */
  function LastUsedDot({ on }: { on: boolean }): React.ReactElement | null {
    if (!on) return null;
    return (
      <span
        aria-label={L.common.lastUsed}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary,theme(colors.primary.500))]"
      />
    );
  }

  /** Wraps a method button so the marker can sit on its edge. */
  function Marked({ on, children }: { on: boolean; children: React.ReactNode }): React.ReactElement {
    if (!on) return <>{children}</>;
    return (
      <div className="relative">
        <LastUsed on />
        {children}
      </div>
    );
  }

  // 이메일·전화 구간은 버튼 하나로 여러 방법을 감당한다. 지금 고른 탭이 어떤
  // 방법에 해당하는지 계산해, 지난번 방법과 같을 때만 표시를 붙인다.
  //
  // 코드로 받든 링크로 받든 사람이 하는 일은 "이메일을 넣는다"로 같아서, 둘을
  // 하나로 묶어 본다. 표시가 답하는 질문은 "지난번에 구글이었나 이메일이었나"지
  // "코드였나 링크였나"가 아니다.
  const emailFamily = ['email_otp', 'magic_link'];
  const lastWasEmail = lastMethod !== null && emailFamily.includes(lastMethod);
  const lastWasPhone = lastMethod === 'phone_otp';
  const identifierMatches = usingPhone ? lastWasPhone : lastWasEmail;
  // 지난번 방법이 지금 안 보이는 탭에 있으면, 그 탭에 표시를 붙여 데려간다.
  const emailTabMatches = lastWasEmail && usingPhone;
  const phoneTabMatches = lastWasPhone && !usingPhone;

  const hasUpperMethods = authPolicy.allowPasskey || authPolicy.allowedOauthProviders.length > 0 || customProviders.length > 0;

  // Branding from policy (publishable-key driven). Falls back to neutral defaults.
  const branding = authPolicy.branding;
  // 앱 이름과 화면 제목은 다른 것이다. 이름이 없는 앱에서 제목을 이름 자리에
  // 끌어다 쓰면 "로 / 로그인 / 로그인" 처럼 같은 말이 세 번 나온다 —
  // 가입 화면은 이미 이름이 있을 때만 그 줄을 그리고 있었고, 여기만 빠져 있었다.
  const brandName = branding?.appName || appearance?.logoAlt || '';
  const logoUrl = branding?.logoUrl || appearance?.logoUrl;
  const hasBrandHeader = Boolean(logoUrl || brandName);
  const appName = brandName || L.signIn.title;
  const accentColor = branding?.primaryColor || appearance?.variables?.colorPrimary;
  const textColor = branding?.textColor || undefined;

  // Brand CSS variables. These drive our own primary buttons
  // (`bg-[var(--brand-primary,…)]`) and headings, so they must be present in
  // BOTH modes — `bare` only means "no card chrome", not "no branding".
  const brandStyle: React.CSSProperties | undefined = (accentColor || textColor)
    ? ({
        ...(accentColor ? { ['--brand-primary' as string]: accentColor } : {}),
        ...(textColor ? { ['--brand-text' as string]: textColor, color: textColor } : {}),
      } as React.CSSProperties)
    : undefined;

  // In bare mode the consumer supplies the layout, so we must not introduce a
  // box of our own — `display: contents` carries the variables down the tree
  // without adding a layout box. Returns the node untouched when unbranded.
  const withBrand = (node: React.ReactElement): React.ReactElement =>
    brandStyle
      ? <div style={{ display: 'contents', ...brandStyle }}>{node}</div>
      : node;

  const emailFirst = methodOrder === 'email-first';

  /**
   * 패스키 · 소셜 묶음.
   *
   * `email-first` 에서는 **이메일 아래**로 내려가고, 둘뿐이면 한 줄에 나란히
   * 선다 — 아래로 밀린 보조 수단이 세로로 쌓이면 화면이 길어지기만 한다.
   */
  const oauthCount = authPolicy.allowedOauthProviders.length + customProviders.length;
  const passkeyShown = authPolicy.allowPasskey && passkeyAvailable;
  const sideBySide = emailFirst && passkeyShown && oauthCount === 1;

  const methodButtons = (
    <div className={sideBySide ? 'grid grid-cols-2 gap-2' : 'space-y-4'}>
      {passkeyShown && (
        <Marked on={lastMethod === 'passkey'}>
          <Button onClick={handlePasskey} loading={isLoading} className="w-full" iconRight={<ArrowRightIcon />}>
            {L.signIn.passkey}
          </Button>
        </Marked>
      )}

      {oauthCount > 0 && (
        <div className={sideBySide ? 'contents' : 'grid grid-cols-1 gap-2'}>
          {authPolicy.allowedOauthProviders.map((provider) => (
            <Marked key={provider} on={lastMethod === oauthMethod(provider)}>
              <SocialButton
                provider={provider}
                label={L.signIn.continueWithProvider(providerDisplayName(provider))}
                onClick={() => void handleOAuth(provider)}
                disabled={isLoading}
                className="w-full"
              />
            </Marked>
          ))}
          {customProviders.map((p) => (
            <Marked key={p.key} on={lastMethod === oauthMethod(p.key)}>
              <SocialButton
                provider={p.key}
                label={L.signIn.continueWithProvider(p.name)}
                iconUrl={p.iconUrl}
                onClick={() => void handleOAuth(p.key)}
                disabled={isLoading}
                className="w-full"
              />
            </Marked>
          ))}
        </div>
      )}
    </div>
  );

  const emailBlock = (authPolicy.allowEmailOtp || authPolicy.allowMagicLink || allowedKinds.includes('phone')) && (
        <>
          {hasUpperMethods && !emailFirst && <Divider label={L.common.divider} className="my-2" />}

          {magicLinkSentTo ? (
            // Confirmation panel after a successful magic-link send. We don't
            // know when the user actually clicks the link, so we just tell
            // them to check their inbox and offer a way back.
            <div className="space-y-3 text-center">
              <div className="text-sm text-neutral-700">
                {L.signIn.magicLinkSent(
                  <strong className="text-neutral-900">{magicLinkSentTo}</strong>,
                )}
              </div>
              <p className="text-xs text-neutral-500">{L.signIn.magicLinkNote}</p>
              <button
                type="button"
                onClick={() => {
                  resetMagicLink();
                  setEmail('');
                }}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700"
              >
                {L.signIn.magicLinkUseAnother}
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
                      className={`relative flex-1 py-1.5 rounded font-medium ${
                        identifierKind === 'email' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                      }`}
                    >
                      {L.common.emailTab}
                      <LastUsedDot on={emailTabMatches} />
                    </button>
                  )}
                  {allowedKinds.includes('phone') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifierKind('phone');
                        setEmail('');
                      }}
                      className={`relative flex-1 py-1.5 rounded font-medium ${
                        identifierKind === 'phone' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                      }`}
                    >
                      {L.common.phoneTab}
                      <LastUsedDot on={phoneTabMatches} />
                    </button>
                  )}
                </div>
              )}

              <Input
                label={usingPhone ? L.common.phoneLabel : L.common.emailLabel}
                type={usingPhone ? 'tel' : 'email'}
                inputMode={usingPhone ? 'tel' : 'email'}
                autoComplete={usingPhone ? 'tel' : 'email'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={usingPhone ? L.common.phonePlaceholder : L.common.emailPlaceholder}
              />
              <Marked on={identifierMatches}>
                <Button type="submit" loading={isLoading} disabled={!email} className="w-full" iconRight={<ArrowRightIcon />}>
                  {!usingPhone && emailMode === 'magic_link' ? L.signIn.magicLinkSubmit : L.common.submit}
                </Button>
              </Marked>

              {/* Magic-link mode switcher only visible when on the email tab AND
                  both methods are enabled — hidden on phone or when only one
                  email method is on. */}
              {!usingPhone && authPolicy.allowEmailOtp && authPolicy.allowMagicLink && (
                <button
                  type="button"
                  onClick={() => setEmailMode((m) => (m === 'otp' ? 'magic_link' : 'otp'))}
                  className="w-full text-sm text-neutral-500 hover:text-neutral-700"
                >
                  {emailMode === 'otp' ? L.signIn.switchToMagicLink : L.signIn.switchToOtp}
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={(e) => void handleOtpSubmit(e)} className="space-y-4">
              <p className="text-sm text-neutral-600">
                {(usingPhone ? L.common.otpSentToPhone : L.common.otpSentToEmail)(
                  <strong className="text-neutral-900">{email}</strong>,
                )}
              </p>
              <Input
                label={L.common.otpLabel}
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={L.common.otpPlaceholder}
              />
              <Button type="submit" loading={isLoading} disabled={!otp} className="w-full" iconRight={<ArrowRightIcon />}>
                {L.common.verifyOtp}
              </Button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700"
              >
                {usingPhone ? L.common.restartPhone : L.common.restartEmail}
              </button>
            </form>
          )}
        </>
      );

  /**
   * 차례를 여기서 정한다.
   *
   * `email-first` 의 구분선은 「또는」이 아니라 **「이미 등록하셨다면」**이다.
   * 아래로 내려간 패스키·소셜은 처음 오는 사람이 쓸 수 없는 수단이라, 「또는」
   * 으로 두면 「둘 중 아무거나」로 읽혀서 눌러 보고 막힌다.
   */
  const inner = (
    <div className="space-y-4" style={{ fontFamily: appearance?.variables?.fontFamily }}>
      <ErrorBanner error={error} labels={L} />

      {emailFirst ? (
        <>
          {emailBlock}
          {hasUpperMethods && <Divider label={L.common.registeredDivider} className="my-2" />}
          {methodButtons}
        </>
      ) : (
        <>
          {methodButtons}
          {emailBlock}
        </>
      )}
    </div>
  );

  // Primary auth done but session is mfa_pending — replace the auth methods
  // with the MFA challenge UI so the user can complete sign-in. We render
  // bare here so the parent's <Card>/<AuthLayout> stays consistent.
  if (mfaPending) {
    return bare ? withBrand(<MFAChallenge bare onSuccess={onSuccess} locale={locale} labels={labelOverrides} />) : (
      <div
        className="min-h-[100vh] w-full bg-neutral-50 font-sans flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">
          <Card>
            <MFAChallenge bare onSuccess={onSuccess} locale={locale} labels={labelOverrides} />
          </Card>
        </div>
      </div>
    );
  }

  if (bare) {
    // Consumer owns the card; we still hand down the brand variables so the
    // buttons inside `inner` are the dashboard's color, not our default.
    return withBrand(inner);
  }

  // Self-contained branded card — what SDK consumers see when dropping <SignIn /> standalone.
  // Branding values come from /api/auth/policy via context; no manual props needed.
  // Wait for the policy fetch to complete before rendering so we don't flash
  // the default-policy state and then re-render with the brand-correct one.
  // Brand styles are exposed via CSS custom properties so descendants pick them
  // up (e.g. headings reference `var(--brand-text, …)`). Primary drives
  // buttons / focus rings; text color drives the heading + body copy on the
  // card (falls back to neutral palette when unset).
  const cardStyle = brandStyle;

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
                {hasBrandHeader && (
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
                    {brandName && (
                      <span className="text-base font-semibold text-neutral-900 truncate">{brandName}</span>
                    )}
                  </div>
                )}
                <h1 className="text-lg font-semibold text-neutral-900">{L.signIn.title}</h1>
              </div>
              {inner}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * 소셜 버튼에 쓸 제공자 이름.
 *
 * 정책이 주는 값은 `google` 같은 소문자 키다. 브랜드 이름은 번역하지 않는
 * 것이 맞으므로(핸드오프 §1 "이름은 표준대로"), 널리 쓰는 표기만 바로잡고
 * 나머지는 첫 글자만 대문자로 올린다.
 */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
  kakao: 'Kakao',
  naver: 'Naver',
  facebook: 'Facebook',
  microsoft: 'Microsoft',
};

export function providerDisplayName(provider: string): string {
  const known = PROVIDER_DISPLAY_NAMES[provider.toLowerCase()];
  if (known) return known;
  if (!provider) return '';
  return provider.charAt(0).toUpperCase() + provider.slice(1);
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
