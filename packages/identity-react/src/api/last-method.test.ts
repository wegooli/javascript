// 이 모듈은 브라우저 저장소를 다룬다 — node 환경에는 window 가 없다.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  readLastMethod,
  rememberLastMethod,
  stashPendingMethod,
  promotePendingMethod,
  clearLastMethod,
  oauthMethod,
} from './last-method';

describe('last used sign-in method', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('remembers a completed sign-in', () => {
    expect(readLastMethod()).toBeNull();
    rememberLastMethod('passkey');
    expect(readLastMethod()).toBe('passkey');
  });

  it('namespaces oauth providers so one named "passkey" cannot collide', () => {
    expect(oauthMethod('passkey')).toBe('oauth:passkey');
    rememberLastMethod(oauthMethod('google'));
    expect(readLastMethod()).toBe('oauth:google');
    expect(readLastMethod()).not.toBe('google');
  });

  // 리다이렉트로 나가는 순간에는 성공했는지 알 수 없다. 돌아와서 확인되기
  // 전까지는 "지난번 방법"으로 보여주면 안 된다 — 취소하고 온 사람에게
  // 쓰지도 않은 방법이 표시된다.
  it('does not show a pending attempt as the last used method', () => {
    stashPendingMethod(oauthMethod('google'));
    expect(readLastMethod()).toBeNull();
  });

  it('promotes the attempt once the round trip succeeds', () => {
    stashPendingMethod(oauthMethod('google'));
    expect(promotePendingMethod()).toBe('oauth:google');
    expect(readLastMethod()).toBe('oauth:google');
  });

  it('promoting with nothing pending changes nothing', () => {
    rememberLastMethod('email_otp');
    expect(promotePendingMethod()).toBeNull();
    expect(readLastMethod()).toBe('email_otp');
  });

  // 한 번 성공하면 그 전에 눌렀다 만 시도는 남아 있으면 안 된다.
  it('clears a stale attempt when another method succeeds', () => {
    stashPendingMethod(oauthMethod('google'));
    rememberLastMethod('passkey');
    expect(promotePendingMethod()).toBeNull();
    expect(readLastMethod()).toBe('passkey');
  });

  it('forgets on request', () => {
    rememberLastMethod('passkey');
    clearLastMethod();
    expect(readLastMethod()).toBeNull();
  });

  // 사생활 보호 모드·웹뷰에서는 storage 접근 자체가 예외를 던진다.
  // 힌트 하나 때문에 로그인 화면이 깨지면 안 된다.
  it('survives storage being unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    expect(() => rememberLastMethod('passkey')).not.toThrow();
    expect(readLastMethod()).toBeNull();
    Object.defineProperty(window, 'localStorage', original);
  });

  it('ignores an absurdly long stored value', () => {
    window.localStorage.setItem('wg_last_method', 'x'.repeat(200));
    expect(readLastMethod()).toBeNull();
  });
});
