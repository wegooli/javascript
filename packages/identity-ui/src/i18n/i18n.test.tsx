import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MockProvider, IdentityError } from '@wegooli/identity-react';
import { SignIn } from '../components/SignIn/SignIn';
import { describeError, resolveLocale, mergeLabels, ko, en } from './index';

// 훅은 SignIn.test.tsx 와 같은 방식으로 대신한다. 여기서 보는 것은
// "무슨 글자가 나오는가" 하나다.
const hookState = {
  error: null as Error | null,
};

vi.mock('@wegooli/identity-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@wegooli/identity-react')>();
  const idle = { isLoading: false, get error() { return hookState.error; } };
  return {
    ...actual,
    useSignIn: vi.fn(() => ({ signIn: vi.fn(), ...idle })),
    useEmailOTP: vi.fn(() => ({ send: vi.fn(), verify: vi.fn(), ...idle })),
    usePhoneOTP: vi.fn(() => ({ send: vi.fn(), verify: vi.fn(), ...idle })),
    useMagicLink: vi.fn(() => ({ send: vi.fn(), sentTo: null, reset: vi.fn(), ...idle })),
    usePasskey: vi.fn(() => ({ signInWithPasskey: vi.fn(), isAvailable: true, ...idle })),
  };
});

const POLICY = {
  allowPasskey: true,
  allowEmailOtp: true,
  allowedOauthProviders: ['google'],
  ssoEnabled: false,
};

function renderSignIn(ui: React.ReactElement) {
  return render(<MockProvider>{ui}</MockProvider>);
}

beforeEach(() => {
  hookState.error = null;
  window.localStorage.clear();
});

describe('로그인 화면의 언어', () => {
  // 이 일감의 핵심. 아무것도 넘기지 않은 소비자 앱이 SDK 만 올려도 한국어가 된다.
  it('아무것도 넘기지 않으면 한국어다', () => {
    renderSignIn(<SignIn authPolicy={POLICY} />);
    expect(screen.getByText('패스키로 로그인')).toBeDefined();
    expect(screen.getByLabelText('이메일 주소')).toBeDefined();
    expect(screen.getByText('Google 계정으로 로그인')).toBeDefined();
  });

  it('locale="en" 이면 영어다', () => {
    renderSignIn(<SignIn authPolicy={POLICY} locale="en" />);
    expect(screen.getByText('Continue with passkey')).toBeDefined();
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.queryByText('패스키로 로그인')).toBeNull();
  });

  // 고객사가 대시보드에서 고르게 될 자리. 지금은 서버가 아직 안 보내지만,
  // 보내기 시작하면 SDK 를 다시 고치지 않아도 되게 미리 읽는다.
  it('앱 설정에 적힌 언어를 따른다', () => {
    renderSignIn(
      <SignIn
        authPolicy={{
          ...POLICY,
          branding: { appName: 'Paper', logoUrl: '', primaryColor: '', locale: 'en' },
        }}
      />,
    );
    expect(screen.getByText('Continue with passkey')).toBeDefined();
  });

  // BFF 는 "정하지 않음"을 빈 문자열로 보낸다. 브랜드 색에서 한 번 당한 자리다.
  it('앱 설정의 언어가 빈 문자열이면 기본값으로 돌아간다', () => {
    renderSignIn(
      <SignIn
        authPolicy={{
          ...POLICY,
          branding: { appName: 'Paper', logoUrl: '', primaryColor: '', locale: '' },
        }}
      />,
    );
    expect(screen.getByText('패스키로 로그인')).toBeDefined();
  });

  it('prop 으로 넘긴 언어가 앱 설정보다 우선한다', () => {
    renderSignIn(
      <SignIn
        locale="ko"
        authPolicy={{
          ...POLICY,
          branding: { appName: 'Paper', logoUrl: '', primaryColor: '', locale: 'en' },
        }}
      />,
    );
    expect(screen.getByText('패스키로 로그인')).toBeDefined();
  });

  it('문구를 하나만 바꿔 넣을 수 있다', () => {
    renderSignIn(
      <SignIn authPolicy={POLICY} labels={{ signIn: { passkey: '지문으로 들어가기' } }} />,
    );
    expect(screen.getByText('지문으로 들어가기')).toBeDefined();
    // 안 넘긴 것은 그대로 한국어여야 한다.
    expect(screen.getByLabelText('이메일 주소')).toBeDefined();
  });
});

describe('카드 머리말', () => {
  // 앱 이름이 없을 때 제목을 이름 자리로 끌어다 쓰면 "로 / 로그인 / 로그인"
  // 처럼 같은 말이 세 번 나온다. 영어일 때도 겹쳤지만 티가 안 났을 뿐이다.
  it('앱 이름이 없으면 제목만 한 번 나온다', () => {
    renderSignIn(<SignIn authPolicy={POLICY} />);
    expect(screen.getAllByText('로그인')).toHaveLength(1);
  });

  it('앱 이름이 있으면 이름과 제목이 같이 나온다', () => {
    renderSignIn(
      <SignIn
        authPolicy={{
          ...POLICY,
          branding: { appName: '스페이스노트', logoUrl: '', primaryColor: '' },
        }}
      />,
    );
    expect(screen.getByText('스페이스노트')).toBeDefined();
    expect(screen.getAllByText('로그인')).toHaveLength(1);
  });
});

describe('오류를 사람 말로 바꾸기', () => {
  // 여태 화면에 그대로 나오던 문장이다. 앱을 쓰는 사람에게는 아무 뜻이 없다.
  const RAW = 'BFF request failed (400): {"error":"invalid_phone"}';

  it('서버 응답 원문 대신 우리 문장을 보여 준다', async () => {
    hookState.error = new IdentityError(RAW, { code: 'invalid_phone', status: 400 });
    renderSignIn(<SignIn authPolicy={POLICY} />);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('휴대폰 번호 형식이');
    });
    expect(screen.queryByText(RAW)).toBeNull();
    expect(document.body.textContent).not.toContain('BFF request failed');
  });

  it('모르는 오류도 원문을 흘리지 않는다', async () => {
    hookState.error = new IdentityError('BFF request failed (500): boom at internal/db.go:42', {
      code: 'something_new',
      status: 500,
    });
    renderSignIn(<SignIn authPolicy={POLICY} />);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(ko.errors.fallback);
    });
    expect(document.body.textContent).not.toContain('internal/db.go');
  });

  // 개발자는 개발자 도구에서 무엇이 났는지 볼 수 있어야 한다.
  it('오류 코드는 화면에 안 보이되 속성으로 남는다', async () => {
    hookState.error = new IdentityError(RAW, { code: 'invalid_phone' });
    renderSignIn(<SignIn authPolicy={POLICY} />);
    await waitFor(() => {
      expect(screen.getByRole('alert').getAttribute('data-error-code')).toBe('invalid_phone');
    });
  });

  it('너무 자주 눌렀을 때는 얼마나 기다릴지 알려 준다', () => {
    const err = new IdentityError('rate limited', { code: 'rate_limited', retryAfter: 90 });
    expect(describeError(err, ko)).toBe('너무 자주 시도했습니다. 2분 뒤에 다시 시도해 주세요.');
    expect(describeError(err, en)).toBe('Too many attempts. Please try again in 2 minutes.');
  });

  it('기다릴 시간을 모르면 시간을 말하지 않는다', () => {
    const err = new IdentityError('rate limited', { code: 'rate_limited' });
    expect(describeError(err, ko)).toBe('너무 자주 시도했습니다. 잠시 뒤에 다시 시도해 주세요.');
  });

  it('오류가 없으면 아무것도 안 나온다', () => {
    expect(describeError(null, ko)).toBeNull();
    renderSignIn(<SignIn authPolicy={POLICY} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // 사람이 지문/얼굴 확인 창을 닫는 것은 흔한 일이고 실패가 아니다.
  it('패스키를 취소하면 다음에 할 일을 알려 준다', () => {
    const err = new IdentityError('cancelled', { code: 'passkey_cancelled' });
    expect(describeError(err, ko)).toContain('이메일로 로그인');
  });

  // 코드가 없는 옛 오류(그냥 Error)도 원문을 흘리면 안 된다.
  it('코드가 없는 오류는 일반 안내로 덮는다', () => {
    expect(describeError(new Error('TypeError: fetch failed'), ko)).toBe(ko.errors.fallback);
  });
});

describe('사전 고르기와 합치기', () => {
  it('모르는 언어가 오면 기본값으로 돌아간다', () => {
    expect(resolveLocale(undefined, null)).toBe('ko');
    expect(resolveLocale('en')).toBe('en');
    // 서버가 준 값이 우리가 모르는 것일 수 있다.
    expect(resolveLocale(undefined, { ...POLICY, branding: { appName: '', logoUrl: '', primaryColor: '', locale: 'ja' as never } })).toBe('ko');
  });

  it('일부만 덮어써도 나머지는 남는다', () => {
    const merged = mergeLabels(ko, {
      common: { submit: '다음' },
      errors: { byCode: { invalid_email: '메일 주소를 다시 봐 주세요.' } },
    });
    expect(merged.common.submit).toBe('다음');
    expect(merged.common.emailLabel).toBe(ko.common.emailLabel);
    expect(merged.errors.byCode.invalid_email).toBe('메일 주소를 다시 봐 주세요.');
    // 안 건드린 오류 문장은 그대로 있어야 한다 — byCode 를 통째로 갈아끼우면
    // 나머지 오류가 전부 일반 안내로 떨어진다.
    expect(merged.errors.byCode.verify_failed).toBe(ko.errors.byCode.verify_failed);
    expect(merged.errors.fallback).toBe(ko.errors.fallback);
  });

  it('두 언어가 같은 항목을 갖는다', () => {
    // 한쪽에만 있는 문구가 생기면 그 언어에서 화면이 빈칸으로 나온다.
    const flatten = (o: object, prefix = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
      );
    expect(flatten(en).sort()).toEqual(flatten(ko).sort());
  });
});
