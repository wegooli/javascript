import React, { useState } from 'react';

import { Button } from '../../primitives/Button';

/**
 * 화면에 그릴 위임 하나.
 *
 * 서버에서 온 위임장을 **사람이 읽을 말로 옮긴 뒤** 넘긴다. 이 컴포넌트는
 * scope 문자열의 뜻을 모른다 — 그 뜻은 그 권한을 가진 서비스가 선언한 것이고,
 * 여기서 지어내면 사람이 읽고 판단하는 유일한 문장이 거짓말이 된다.
 */
export interface DelegationSummary {
  /** 위임장 id. 끄기가 이 값으로 이뤄진다 */
  id: string;
  /** 무엇에게 맡겼는가. 예: "전자서명 계약 도우미" */
  agentName: string;
  /** 어디에 대해서인가. 예: "전자서명" */
  resourceName?: string;
  /** 할 수 있게 된 일들. 서비스가 선언한 문장 그대로 */
  permissions: Array<{
    /** 사람이 읽는 문장. 1인칭 현재형 */
    label: string;
    /** 원래 권한 이름. 개발자가 대조할 때만 필요하다 */
    name?: string;
    /** 되돌리기 어려운 권한 */
    sensitive?: boolean;
  }>;
  /** 언제까지 유효한가 */
  expiresAt?: string | Date;
  /** 마지막으로 쓰인 때. 모르면 비운다 — 모르는 것을 "없음" 으로 쓰지 않는다 */
  lastUsedAt?: string | Date;
}

export interface DelegationManagerProps {
  /** 지금 켜져 있는 위임들 */
  delegations: DelegationSummary[];
  /**
   * 끄기. 고객사 백엔드가 `@wegooli/identity-delegation` 의
   * `grants.revoke()` 를 부르도록 연결한다.
   *
   * **브라우저에서 Identity 를 직접 부르지 않는다.** 그 API 는 sk_ 비밀 키로
   * 인증하고, 그 키가 브라우저에 있으면 누구나 이 조직의 모든 위임을 만들고
   * 지울 수 있다. 그래서 이 컴포넌트는 스스로 네트워크를 쓰지 않는다.
   */
  onRevoke: (delegationId: string) => Promise<void> | void;
  /** 목록을 아직 불러오는 중 */
  loading?: boolean;
  /** 하나도 없을 때 보여줄 문장 */
  emptyText?: string;
  className?: string;
}

/**
 * "지금 무엇을 위임했고, 누가 쓰고 있고, 여기서 끈다."
 *
 * ── 이 화면 조각이 왜 라이브러리로 있는가 ────────────────────────────────────
 *
 * 위임을 만드는 코드는 고객마다 다르게 짜여도 대개 동작한다. **끄는 화면은
 * 안 만들어도 아무것도 깨지지 않는다.** 그래서 빠진다 — 스페이스노트에서
 * 실제로 그렇게 됐다. "언제든 끌 수 있습니다" 라고 화면에 적어 두고, 끄는
 * 자리가 없었다.
 *
 * 그래서 이걸 우리가 만들어 준다. 붙이는 비용이 만드는 비용보다 낮아야
 * 빠지지 않는다.
 *
 * ── 끄는 곳은 두 군데다 ──────────────────────────────────────────────────────
 *
 * 이 조각은 그중 **본인이 끄는 쪽**이다. 자기가 아는 화면에서 끈다.
 * 나머지 하나 — **회사가 끄는 쪽** — 은 우리 대시보드에 있고, 그건 고객사
 * 시스템이 통째로 멈춰도 들어야 하므로 고객사 화면 안에 둘 수 없다.
 */
export function DelegationManager({
  delegations,
  onRevoke,
  loading,
  emptyText = '지금 맡겨 둔 것이 없습니다.',
  className = '',
}: DelegationManagerProps): React.ReactElement {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const revoke = async (id: string) => {
    setBusy(id);
    setFailed(null);
    try {
      await onRevoke(id);
      setConfirming(null);
    } catch {
      // 끄기가 실패했다는 것은 반드시 보여야 한다. 조용히 삼키면 사람은 껐다고
      // 믿고 화면을 떠나고, 위임은 살아 있다.
      setFailed(id);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className={`py-8 flex justify-center ${className}`}>
        <span
          aria-hidden
          className="w-5 h-5 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"
        />
        <span className="sr-only">불러오는 중</span>
      </div>
    );
  }

  if (delegations.length === 0) {
    return <p className={`text-sm text-neutral-500 py-6 text-center ${className}`}>{emptyText}</p>;
  }

  return (
    <ul className={`space-y-3 ${className}`}>
      {delegations.map((d) => (
        <li key={d.id} className="border border-neutral-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-neutral-900 truncate">{d.agentName}</p>
              {d.resourceName && (
                <p className="text-xs text-neutral-500 mt-0.5">{d.resourceName} 에 대해</p>
              )}
            </div>

            {confirming === d.id ? (
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="md" onClick={() => setConfirming(null)}>
                  그대로 두기
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  loading={busy === d.id}
                  onClick={() => void revoke(d.id)}
                  className="!text-red-600 !border-red-200 hover:!bg-red-50"
                >
                  끕니다
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="md"
                className="shrink-0"
                onClick={() => setConfirming(d.id)}
              >
                끄기
              </Button>
            )}
          </div>

          <ul className="mt-3 space-y-1">
            {d.permissions.map((p) => (
              <li key={p.name ?? p.label} className="text-sm text-neutral-700 flex items-start gap-2">
                <span aria-hidden className={p.sensitive ? 'text-amber-500' : 'text-neutral-400'}>
                  •
                </span>
                <span className={p.sensitive ? 'font-medium text-amber-900' : undefined}>
                  {p.label}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
            {d.lastUsedAt ? <>마지막으로 쓰인 때 {formatWhen(d.lastUsedAt)}</> : <>아직 쓰인 적이 없습니다</>}
            {d.expiresAt && <> · {formatWhen(d.expiresAt)} 까지</>}
          </p>

          {confirming === d.id && (
            // 끄면 무슨 일이 일어나는지 말해 준다. "정말 하시겠습니까" 만 묻는
            // 확인창은 사람에게 아무 정보도 주지 않는다.
            <p className="mt-2 text-xs text-neutral-600">
              끄면 <strong>즉시</strong> 멈춥니다. 이미 발급된 권한도 함께 무효가 됩니다.
            </p>
          )}
          {failed === d.id && (
            <p className="mt-2 text-xs text-red-600">
              끄지 못했습니다. 아직 살아 있으니 다시 시도해 주세요.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 날짜를 사람이 읽는 짧은 형태로. 시각까지는 필요 없다. */
function formatWhen(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}
