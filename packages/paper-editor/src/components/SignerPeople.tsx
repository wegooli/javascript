import type { EditorField } from '../types';
import { MAX_SIGNER_SLOTS, displayNames, signerColorSlot } from '../signers';

export function SignerPeople({
  count,
  active,
  roles,
  fields,
  onCount,
  onActive,
  onRole,
}: {
  count: number;
  active: number;
  roles: Readonly<Record<number, string>>;
  fields: readonly EditorField[];
  onCount: (next: number) => void;
  onActive: (index: number) => void;
  onRole: (slot: number, role: string) => void;
}) {
  const names = displayNames(count, roles);
  return (
    <aside className="wg-paper-people">
      <h2>서명하실 분</h2>
      <p>
        이 양식으로 보낼 때 몇 분이 서명하시는지 정합니다. 이름과 연락처는 보낼 때 받습니다. 자리
        이름을 적어 두면 보낼 때 「임대인」처럼 부릅니다.
      </p>
      <ul>
        {names.map((name, index) => {
          const slot = index + 1;
          const has = fields.some((field) => field.type === 'SIGNATURE' && (field.signerSlot || 1) === slot);
          return (
            <li key={slot}>
              <button
                type="button"
                aria-pressed={active === index}
                aria-label={`${name} 고르기`}
                onClick={() => onActive(index)}
              >
                <span className="wg-paper-swatch" data-signer={String(signerColorSlot(slot))} aria-hidden />
                <span>{name}</span>
                <span className={has ? 'wg-paper-has' : 'wg-paper-none'}>{has ? '칸 있음' : '칸 없음'}</span>
              </button>
              {active === index && (
                <input
                  className="wg-paper-role"
                  aria-label={`${slot}번 자리 이름`}
                  value={roles[slot] ?? ''}
                  maxLength={50}
                  placeholder="자리 이름 (예: 임대인)"
                  onChange={(event) => onRole(slot, event.target.value)}
                />
              )}
            </li>
          );
        })}
      </ul>
      <div className="wg-paper-toolbar">
        <button
          type="button"
          onClick={() => onCount(Math.min(MAX_SIGNER_SLOTS, count + 1))}
          disabled={count >= MAX_SIGNER_SLOTS}
        >
          + 한 분 더
        </button>
        {count > 1 && (
          <button type="button" onClick={() => onCount(count - 1)}>
            마지막 분 빼기
          </button>
        )}
      </div>
      <p>사람을 고르고 문서 위에 그분의 서명칸을 놓으십시오. 칸 색이 그분의 색입니다.</p>
    </aside>
  );
}
