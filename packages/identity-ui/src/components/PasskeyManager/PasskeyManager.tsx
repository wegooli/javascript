import React, { useEffect, useState } from 'react';
import { usePasskey, type PasskeyCredential } from '@wegooli/identity-react';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';

export interface PasskeyManagerProps {
  /** Optional class name for the container. */
  className?: string;
}

/**
 * "Manage devices" UI for an authenticated user. Shows registered passkeys
 * with last-used timestamps and a button to register a new one. Drop into
 * the user's profile / security settings page.
 */
export function PasskeyManager({ className }: PasskeyManagerProps): React.ReactElement {
  const { listCredentials, registerPasskey, deleteCredential, isAvailable, isLoading, error } = usePasskey();
  const [creds, setCreds] = useState<PasskeyCredential[]>([]);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await listCredentials();
      setCreds(list);
    } catch {
      /* surfaced via `error` */
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  const onRegister = async () => {
    setBusy('register');
    try {
      await registerPasskey(label || undefined);
      setLabel('');
      await refresh();
    } catch {
      /* surfaced via `error` */
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('이 패스키를 삭제하시겠습니까? 해당 기기로는 더 이상 로그인할 수 없습니다.')) return;
    setBusy(id);
    try {
      await deleteCredential(id);
      setCreds((prev) => prev.filter((c) => c.credentialId !== id));
    } finally {
      setBusy(null);
    }
  };

  if (!isAvailable) {
    return (
      <div className={className}>
        <p className="text-sm text-neutral-500">
          이 브라우저에서는 패스키를 사용할 수 없습니다. 최신 Chrome / Safari / Edge / Firefox에서 시도해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      <div>
        <h3 className="text-sm font-medium text-neutral-900">Passkeys</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          비밀번호 없이 OS의 생체 인증(Touch ID, Windows Hello)이나 보안 키로 로그인합니다.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
          {error.message}
        </div>
      )}

      {creds.length === 0 ? (
        <p className="text-xs text-neutral-400 italic">등록된 패스키가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-md">
          {creds.map((c) => (
            <li key={c.credentialId} className="flex items-center justify-between p-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 font-mono truncate">
                  {c.credentialId.slice(0, 16)}…
                </div>
                <div className="text-[11px] text-neutral-500">
                  등록 {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                  {c.lastUsedAt && ` · 마지막 사용 ${new Date(c.lastUsedAt).toLocaleDateString('ko-KR')}`}
                </div>
              </div>
              <button
                onClick={() => void onDelete(c.credentialId)}
                disabled={busy === c.credentialId}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {busy === c.credentialId ? '삭제 중…' : '삭제'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2 pt-2 border-t border-neutral-100">
        <div className="flex-1">
          <Input
            label="새 패스키 라벨 (선택)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: Work iPhone"
          />
        </div>
        <Button onClick={() => void onRegister()} loading={isLoading || busy === 'register'} disabled={busy === 'register'}>
          패스키 추가
        </Button>
      </div>
    </div>
  );
}
