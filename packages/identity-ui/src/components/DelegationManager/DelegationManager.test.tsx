import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DelegationManager, type DelegationSummary } from './DelegationManager';

const one: DelegationSummary = {
  id: 'grant-1',
  agentName: '전자서명 계약 도우미',
  resourceName: '전자서명',
  permissions: [
    { name: 'sign:read', label: '내 전자서명 문서를 읽습니다' },
    { name: 'sign:create', label: '내 이름으로 계약을 만들고 보냅니다', sensitive: true },
  ],
  expiresAt: '2026-12-31T00:00:00Z',
};

describe('DelegationManager', () => {
  it('맡긴 것을 서비스가 쓴 문장 그대로 보여준다', () => {
    // 이 컴포넌트는 `sign:create` 의 뜻을 모른다. 알면 안 된다 — 그 뜻은 그
    // 권한을 가진 서비스가 선언한 것이고, 여기서 지어내면 사람이 읽고
    // 판단하는 유일한 문장이 거짓말이 된다.
    render(<DelegationManager delegations={[one]} onRevoke={vi.fn()} />);

    expect(screen.getByText('전자서명 계약 도우미')).toBeTruthy();
    expect(screen.getByText('내 이름으로 계약을 만들고 보냅니다')).toBeTruthy();
    expect(screen.queryByText('sign:create')).toBeNull();
  });

  it('끄기는 무슨 일이 일어나는지 말한 뒤에 실행된다', async () => {
    const onRevoke = vi.fn().mockResolvedValue(undefined);
    render(<DelegationManager delegations={[one]} onRevoke={onRevoke} />);

    fireEvent.click(screen.getByText('끄기'));
    // "정말 하시겠습니까" 만 묻는 확인창은 사람에게 아무 정보도 주지 않는다.
    expect(screen.getByText(/즉시/)).toBeTruthy();
    expect(onRevoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('끕니다'));
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith('grant-1'));
  });

  it('끄기가 실패하면 실패했다고 말한다', async () => {
    // 조용히 삼키면 사람은 껐다고 믿고 화면을 떠나고, 위임은 살아 있다.
    // 이 화면에서 그건 가장 나쁜 실패다.
    const onRevoke = vi.fn().mockRejectedValue(new Error('network'));
    render(<DelegationManager delegations={[one]} onRevoke={onRevoke} />);

    fireEvent.click(screen.getByText('끄기'));
    fireEvent.click(screen.getByText('끕니다'));

    await waitFor(() => expect(screen.getByText(/끄지 못했습니다/)).toBeTruthy());
    expect(screen.getByText(/아직 살아 있으니/)).toBeTruthy();
  });

  it('한 번도 안 쓰인 것을 "없음" 이라고 하지 않는다', () => {
    // lastUsedAt 을 모르는 것과 "쓰인 적 없음" 은 다르다. 모르는 것을 단정하면
    // 사람이 "안 쓰이니 그냥 두자" 로 읽는다.
    render(<DelegationManager delegations={[one]} onRevoke={vi.fn()} />);
    expect(screen.getByText(/아직 쓰인 적이 없습니다/)).toBeTruthy();
  });

  it('하나도 없으면 그렇게 말한다', () => {
    render(<DelegationManager delegations={[]} onRevoke={vi.fn()} />);
    expect(screen.getByText('지금 맡겨 둔 것이 없습니다.')).toBeTruthy();
  });
});
