import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IDENTITY_SCOPE_CLASS, IdentityScope, withIdentityScope } from './scope';
import { Button } from './index';

describe('identity scope', () => {
  it('wraps children in the scope class', () => {
    const { container } = render(
      <IdentityScope>
        <span data-testid="child">hi</span>
      </IdentityScope>,
    );
    const scope = container.querySelector(`.${IDENTITY_SCOPE_CLASS}`);
    expect(scope).not.toBeNull();
    expect(scope?.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  // dist/styles.css 의 모든 규칙이 `.wg-identity` 후손 선택자다. 래퍼가 레이아웃에
  // 참여하면 소비자의 flex/grid 배치가 틀어지므로 display:contents 여야 한다.
  it('does not participate in layout', () => {
    const { container } = render(
      <IdentityScope>
        <span>hi</span>
      </IdentityScope>,
    );
    const scope = container.querySelector<HTMLElement>(`.${IDENTITY_SCOPE_CLASS}`);
    expect(scope?.style.display).toBe('contents');
  });

  // 스코프가 빠지면 배포된 CSS 가 하나도 적용되지 않는다 — 화면이 조용히 깨진다.
  // 내보내는 컴포넌트는 예외 없이 감싸져 있어야 한다.
  it('exported components carry the scope', () => {
    const { container } = render(<Button>click</Button>);
    expect(container.querySelector(`.${IDENTITY_SCOPE_CLASS}`)).not.toBeNull();
  });

  it('keeps a readable displayName for devtools', () => {
    const Wrapped = withIdentityScope(() => <span />, 'Thing');
    expect(Wrapped.displayName).toBe('withIdentityScope(Thing)');
  });
});
