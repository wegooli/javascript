import React, { useEffect, useState } from 'react';
import { useMFA } from '@wegooli/identity-react';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Card } from '../../primitives/Card';

export interface MFAEnrollProps {
  /** Called after the user successfully enrolls a factor. */
  onSuccess?: () => void;
  /** Bare = no card chrome. */
  bare?: boolean;
  /** Optional default label saved with the factor (e.g. "Work iPhone"). */
  defaultLabel?: string;
}

/**
 * TOTP enrollment ceremony. Two steps:
 *   1. Begin → server returns secret + otpauth URI. UI shows QR + manual key.
 *   2. Confirm → user types first 6-digit code from their authenticator app.
 *
 * After confirm, the BFF auto-completes the session's MFA challenge so the
 * user doesn't have to enter another code immediately.
 */
export function MFAEnroll({ onSuccess, bare = false, defaultLabel }: MFAEnrollProps): React.ReactElement {
  const { beginTOTP, confirmTOTP, isLoading, error } = useMFA();
  const [phase, setPhase] = useState<'idle' | 'show_qr' | 'confirm' | 'done'>('idle');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [label, setLabel] = useState(defaultLabel ?? '');

  // Auto-start enrollment on mount — most callers drop this component when
  // the user clicks "Enable 2FA", so the click already implies consent.
  useEffect(() => {
    if (phase !== 'idle') return;
    void (async () => {
      try {
        const r = await beginTOTP(label);
        setEnrollmentId(r.enrollmentId);
        setOtpauthUrl(r.otpauthUrl);
        setSecret(r.secret);
        setPhase('show_qr');
      } catch {
        // error already captured by hook
      }
    })();
  }, []);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    await confirmTOTP(enrollmentId, code);
    setPhase('done');
    onSuccess?.();
  }

  // QR rendering: we use Google Charts as a zero-dep fallback so identity-ui
  // doesn't have to ship a QR library. Production deployments behind strict
  // CSPs can replace this with a self-hosted QR component — `secret` and
  // `otpauthUrl` are exposed for that case.
  const qrSrc = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(otpauthUrl)}`
    : '';

  const inner = (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Set up two-factor authentication</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Scan the QR code with your authenticator app (1Password, Google Authenticator, Authy…),
          then enter the 6-digit code it shows.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          {error.message}
        </div>
      )}

      {phase === 'show_qr' && (
        <>
          <div className="flex flex-col items-center gap-3 p-4 bg-neutral-50 rounded-md border border-neutral-200">
            {qrSrc && <img src={qrSrc} alt="TOTP QR code" className="w-48 h-48" />}
            <div className="text-xs text-neutral-500">
              Can't scan? Enter this key manually:
            </div>
            <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-neutral-200 break-all">
              {secret}
            </code>
          </div>
          <Button onClick={() => setPhase('confirm')} className="w-full">
            I scanned the code →
          </Button>
        </>
      )}

      {phase === 'confirm' && (
        <form onSubmit={submitCode} className="space-y-4">
          <Input
            label="Verification code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
          />
          <Input
            label="Device label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Work iPhone"
          />
          <Button type="submit" loading={isLoading} disabled={code.length !== 6} className="w-full">
            Confirm
          </Button>
        </form>
      )}

      {phase === 'done' && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm border border-emerald-100">
          Two-factor authentication is now active.
        </div>
      )}
    </div>
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
