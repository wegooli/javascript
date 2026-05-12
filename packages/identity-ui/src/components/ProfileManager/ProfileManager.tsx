import React, { useEffect, useState } from 'react';
import { useProfile } from '@wegooli/identity-react';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';

export interface ProfileManagerProps {
  /** Tailwind className for the outer container. */
  className?: string;
}

/**
 * End-user profile management. Drop into a tenant app's "Account settings"
 * page. Lets the user view + change their email, phone, username, and display
 * name. Verification codes go through the same OTP path as sign-in (email →
 * SMTP, phone → SMSSender).
 */
export function ProfileManager({ className }: ProfileManagerProps): React.ReactElement {
  const {
    profile,
    isLoading,
    error,
    refresh,
    startEmailChange,
    confirmEmailChange,
    startPhoneChange,
    confirmPhoneChange,
    setUsername,
    setDisplayName,
    removeIdentifier,
  } = useProfile();

  useEffect(() => {
    void refresh();
  }, []);

  if (!profile) {
    return (
      <div className={className}>
        {error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : (
          <p className="text-sm text-neutral-500">Loading…</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          {error.message}
        </div>
      )}

      <DisplayNameSection currentValue={profile.displayName} onSave={setDisplayName} loading={isLoading} />

      <EmailSection
        currentValue={profile.email}
        onStart={startEmailChange}
        onConfirm={confirmEmailChange}
        onRemove={() => removeIdentifier('email')}
        loading={isLoading}
      />

      <PhoneSection
        currentValue={profile.phoneNumber}
        onStart={startPhoneChange}
        onConfirm={confirmPhoneChange}
        onRemove={() => removeIdentifier('phone')}
        loading={isLoading}
      />

      <UsernameSection
        currentValue={profile.username}
        onSave={setUsername}
        onRemove={() => removeIdentifier('username')}
        loading={isLoading}
      />
    </div>
  );
}

// ── Sub-sections ────────────────────────────────────────────────────────────

function DisplayNameSection({
  currentValue,
  onSave,
  loading,
}: {
  currentValue: string;
  onSave: (v: string) => Promise<void>;
  loading: boolean;
}): React.ReactElement {
  const [value, setValue] = useState(currentValue);
  useEffect(() => setValue(currentValue), [currentValue]);
  const dirty = value !== currentValue;

  return (
    <Section title="Display name" description="다른 사용자에게 보일 이름입니다.">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="홍길동" />
        </div>
        <Button onClick={() => void onSave(value)} disabled={!dirty || loading} loading={loading}>
          Save
        </Button>
      </div>
    </Section>
  );
}

function EmailSection({
  currentValue,
  onStart,
  onConfirm,
  onRemove,
  loading,
}: {
  currentValue: string;
  onStart: (v: string) => Promise<void>;
  onConfirm: (v: string, code: string) => Promise<void>;
  onRemove: () => Promise<void>;
  loading: boolean;
}): React.ReactElement {
  return (
    <ChangeWithVerificationSection
      title="Email"
      description="새 이메일로 6자리 인증 코드를 발송합니다."
      placeholder="you@example.com"
      type="email"
      currentValue={currentValue}
      onStart={onStart}
      onConfirm={onConfirm}
      onRemove={onRemove}
      loading={loading}
    />
  );
}

function PhoneSection({
  currentValue,
  onStart,
  onConfirm,
  onRemove,
  loading,
}: {
  currentValue: string;
  onStart: (v: string) => Promise<void>;
  onConfirm: (v: string, code: string) => Promise<void>;
  onRemove: () => Promise<void>;
  loading: boolean;
}): React.ReactElement {
  return (
    <ChangeWithVerificationSection
      title="Phone"
      description="새 전화번호로 SMS 인증 코드를 발송합니다."
      placeholder="+82 10 1234 5678"
      type="tel"
      currentValue={currentValue}
      onStart={onStart}
      onConfirm={onConfirm}
      onRemove={onRemove}
      loading={loading}
    />
  );
}

function ChangeWithVerificationSection({
  title,
  description,
  placeholder,
  type,
  currentValue,
  onStart,
  onConfirm,
  onRemove,
  loading,
}: {
  title: string;
  description: string;
  placeholder: string;
  type: 'email' | 'tel';
  currentValue: string;
  onStart: (v: string) => Promise<void>;
  onConfirm: (v: string, code: string) => Promise<void>;
  onRemove: () => Promise<void>;
  loading: boolean;
}): React.ReactElement {
  const [step, setStep] = useState<'idle' | 'verify'>('idle');
  const [pendingValue, setPendingValue] = useState('');
  const [code, setCode] = useState('');

  const start = async () => {
    if (!pendingValue) return;
    await onStart(pendingValue);
    setStep('verify');
  };
  const confirm = async () => {
    await onConfirm(pendingValue, code);
    setStep('idle');
    setPendingValue('');
    setCode('');
  };
  const remove = async () => {
    if (!confirm_(`현재 등록된 ${title.toLowerCase()}을(를) 제거하시겠습니까?`)) return;
    await onRemove();
  };

  return (
    <Section title={title} description={description}>
      {currentValue && (
        <div className="flex items-center gap-2 mb-3">
          <code className="text-sm bg-neutral-100 px-2 py-1 rounded flex-1 truncate">{currentValue}</code>
          <button
            type="button"
            onClick={() => void remove()}
            className="text-xs text-red-600 hover:text-red-800"
          >
            제거
          </button>
        </div>
      )}

      {step === 'idle' ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type={type}
              value={pendingValue}
              onChange={(e) => setPendingValue(e.target.value)}
              placeholder={placeholder}
            />
          </div>
          <Button onClick={() => void start()} disabled={!pendingValue || loading} loading={loading}>
            {currentValue ? 'Change' : 'Add'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            {pendingValue} 로 발송된 6자리 코드를 입력하세요.
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
              />
            </div>
            <Button onClick={() => void confirm()} disabled={code.length !== 6 || loading} loading={loading}>
              Verify
            </Button>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep('idle');
              setCode('');
            }}
            className="text-xs text-neutral-500 hover:text-neutral-700"
          >
            Cancel
          </button>
        </div>
      )}
    </Section>
  );
}

// `confirm` shadows the global; alias to avoid the lint warning when used inline.
function confirm_(msg: string): boolean {
  if (typeof window === 'undefined') return true;
  return window.confirm(msg);
}

function UsernameSection({
  currentValue,
  onSave,
  onRemove,
  loading,
}: {
  currentValue: string;
  onSave: (v: string) => Promise<void>;
  onRemove: () => Promise<void>;
  loading: boolean;
}): React.ReactElement {
  const [value, setValue] = useState(currentValue);
  useEffect(() => setValue(currentValue), [currentValue]);
  const dirty = value !== currentValue && value.length >= 3;

  return (
    <Section title="Username" description="3–32자, 영문/숫자/_/./- 허용. 검증 단계 없이 바로 저장됩니다.">
      {currentValue && (
        <div className="flex items-center gap-2 mb-3">
          <code className="text-sm bg-neutral-100 px-2 py-1 rounded flex-1 truncate">{currentValue}</code>
          <button
            type="button"
            onClick={() => {
              if (confirm_('현재 username을 제거하시겠습니까?')) void onRemove();
            }}
            className="text-xs text-red-600 hover:text-red-800"
          >
            제거
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="my_username" />
        </div>
        <Button onClick={() => void onSave(value)} disabled={!dirty || loading} loading={loading}>
          {currentValue ? 'Change' : 'Add'}
        </Button>
      </div>
    </Section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      {children}
    </section>
  );
}

