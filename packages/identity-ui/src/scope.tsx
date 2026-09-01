import * as React from 'react';

/**
 * 이 라이브러리의 CSS 가 적용되는 범위를 표시하는 클래스.
 *
 * dist/styles.css 는 Tailwind 의 `important: '.wg-identity'` 로 빌드된다.
 * 그래서 모든 유틸리티가 `.wg-identity .p-4 { ... }` 형태가 되고,
 *
 *   - 이 클래스 안쪽에만 적용된다 → 소비자 앱의 같은 이름 클래스를 건드리지 않는다
 *   - 후손 선택자라 명시도가 높다 → 소비자가 간격 스케일을 다르게 정의해 뒀어도
 *     라이브러리 컴포넌트는 의도한 값으로 그려진다
 */
export const IDENTITY_SCOPE_CLASS = 'wg-identity';

/**
 * 자식을 스코프 안에 넣는다.
 *
 * `display: contents` 라서 이 요소 자체는 레이아웃에 참여하지 않는다. 감싸는
 * 것만으로 flex/grid 배치가 달라지면 소비자 화면이 틀어지므로 그렇게 했다.
 */
export function IdentityScope({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={IDENTITY_SCOPE_CLASS} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/**
 * 내보내는 컴포넌트를 스코프로 감싼다.
 *
 * 컴포넌트 내부를 고치는 대신 여기서 한 번에 감싼다 — 컴포넌트마다 최상위
 * 요소가 다르고 로딩 중 조기 반환도 있어서, 내부에 클래스를 다는 방식은
 * 빠뜨리기 쉽다.
 */
export function withIdentityScope<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <IdentityScope>
      <Component {...props} />
    </IdentityScope>
  );
  Wrapped.displayName = `withIdentityScope(${displayName})`;
  return Wrapped;
}
