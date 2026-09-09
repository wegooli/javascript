import React, { useEffect, useState } from 'react';
import { useMFA, useIdentityContext } from '@wegooli/identity-react';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Card } from '../../primitives/Card';
import { ErrorBanner } from '../../primitives/ErrorBanner';
import { useAuthLabels } from '../../i18n';
import type { LocalizableProps } from '../../i18n/types';

export interface MFAChallengeProps extends LocalizableProps {
  /** Called after the challenge succeeds and the session is fully unlocked. */
  onSuccess?: () => void;
  /** Render bare (no card chrome). Default false. */
  bare?: boolean;
}

/**
 * Renders the MFA challenge step. Drop in alongside `<SignIn>` — when the
 * provider's `mfaPending` flips true after primary auth, mount this component
 * (or rely on `<SignIn>` to do so automatically when wired in below).
 *
 * Today supports TOTP. When passkey/SMS factors land they'll appear as
 * sibling tabs inside this same component.
 */
export function MFAChallenge({
  onSuccess,
  bare = false,
  locale,
  labels: labelOverrides,
}: MFAChallengeProps): React.ReactElement {
  const { verifyTOTP, isLoading, error } = useMFA();
  const ctx = useIdentityContext();
  const L = useAuthLabels(locale, labelOverrides, ctx.authPolicy);
  const [code, setCode] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await verifyTOTP(code);
    setDone(true);
    onSuccess?.();
  }

  // After verifyTOTP flips mfa_pending=false on the server, the
  // IdentityProvider's polling/focus refresh will pick that up and the parent
  // page can re-render. Trigger an early refetch on next tick to avoid
  // waiting for the interval.
  useEffect(() => {
    if (!done) return;
    if (typeof window === 'undefined') return;
    // The provider re-fetches on focus; dispatching focus is the cheapest
    // way to nudge it without exposing internal refresh APIs.
    window.dispatchEvent(new Event('focus'));
  }, [done]);

  const inner = (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{L.mfa.title}</h2>
        <p className="text-sm text-neutral-600 mt-1">
          {L.mfa.prompt(
            ctx.user?.email ? <strong className="text-neutral-900">{ctx.user.email}</strong> : null,
          )}
        </p>
      </div>

      <ErrorBanner error={error} labels={L} />

      <Input
        label={L.mfa.codeLabel}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder={L.common.otpPlaceholder}
      />
      <Button type="submit" loading={isLoading} disabled={code.length !== 6} className="w-full">
        {L.mfa.submit}
      </Button>
    </form>
  );

  if (bare) return inner;

  return (
    <div className="min-h-[100vh] w-full bg-neutral-50 font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>{inner}</Card>
      </div>
    </div>
  );
}
