import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockProvider, useEmailOTP } from '@wegooli/identity-react';
import { SignUp } from './SignUp';

// 가입 화면은 「가입」이라고 **직접** 말해야 한다. 서버는 로그인과 가입의 문을 나눠서
// (계정이 없으면 로그인은 account_not_found), 표시가 없으면 가입이 로그인으로 처리된다.
// 예전에는 소비자 앱이 쿠키로 대신 알렸는데, 앱과 통합 인증의 도메인이 다르면
// (예: gw.hailor.ai ↔ api.idp.kr) 쿠키가 넘어가지 않아 Google 가입이 통째로 깨졌다.
vi.mock('@wegooli/identity-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@wegooli/identity-react')>();
  const idle = { isLoading: false, error: null };
  return {
    ...actual,
    useEmailOTP: vi.fn(() => ({ send: vi.fn(), verify: vi.fn(), ...idle })),
    usePhoneOTP: vi.fn(() => ({ send: vi.fn(), verify: vi.fn(), ...idle })),
    useMagicLink: vi.fn(() => ({ send: vi.fn(), sentTo: null, reset: vi.fn(), ...idle })),
  };
});

const POLICY = { allowPasskey: false, allowEmailOtp: true, allowedOauthProviders: ['google'], ssoEnabled: false };

const realLocation = window.location;
let assigned = '';

beforeEach(() => {
  assigned = '';
  // jsdom 은 페이지 이동을 못 한다. href 에 무엇을 넣는지만 받아 둔다
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...realLocation,
      origin: 'https://app.example.com',
      get href() { return assigned || 'https://app.example.com/sign-up'; },
      set href(v: string) { assigned = v; },
    },
  });
});
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

describe('가입 화면은 「가입」이라고 직접 말한다', () => {
  it('이메일 코드 — 훅에 intent: sign-up 을 넘긴다', () => {
    render(<MockProvider><SignUp authPolicy={POLICY} /></MockProvider>);
    expect(vi.mocked(useEmailOTP)).toHaveBeenCalledWith(expect.objectContaining({ intent: 'sign-up' }));
  });

  it('Google — 시작 주소에 intent=sign-up 이 붙는다 (쿠키에 기대지 않는다)', async () => {
    render(<MockProvider><SignUp authPolicy={POLICY} /></MockProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    // PKCE 값을 만든 뒤에 이동한다 (비동기)
    await waitFor(() => expect(assigned).toMatch(/\/api\/auth\/social\/google\/start\?/));
    expect(new URL(assigned, 'https://x').searchParams.get('intent')).toBe('sign-up');
  });
});
