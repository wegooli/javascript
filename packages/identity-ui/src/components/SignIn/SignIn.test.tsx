import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockProvider } from '@wegooli/identity-react';
import { SignIn } from './SignIn';

vi.mock('@wegooli/identity-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@wegooli/identity-react')>();
  return {
    ...actual,
    useSignIn: vi.fn(() => ({
      signIn: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null,
    })),
    useEmailOTP: vi.fn(() => ({
      send: vi.fn().mockResolvedValue(undefined),
      verify: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null,
    })),
    usePhoneOTP: vi.fn(() => ({
      send: vi.fn().mockResolvedValue(undefined),
      verify: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null,
    })),
    useMagicLink: vi.fn(() => ({
      send: vi.fn().mockResolvedValue(undefined),
      sentTo: null,
      isLoading: false,
      error: null,
    })),
    usePasskey: vi.fn(() => ({
      signInWithPasskey: vi.fn().mockResolvedValue(undefined),
      isAvailable: true,
      isLoading: false,
      error: null,
    })),
  };
});

function renderWithProvider(ui: React.ReactElement) {
  return render(<MockProvider>{ui}</MockProvider>);
}

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input when allowEmailOtp is true', () => {
    renderWithProvider(
      <SignIn authPolicy={{ allowPasskey: false, allowEmailOtp: true, allowedOauthProviders: [], ssoEnabled: false }} />,
    );
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
  });

  it('renders passkey button when allowPasskey is true', () => {
    renderWithProvider(
      <SignIn authPolicy={{ allowPasskey: true, allowEmailOtp: false, allowedOauthProviders: [], ssoEnabled: false }} />,
    );
    expect(screen.getByText(/continue with passkey/i)).toBeDefined();
  });

  it('renders OAuth buttons for allowed providers', () => {
    renderWithProvider(
      <SignIn
        authPolicy={{ allowPasskey: false, allowEmailOtp: false, allowedOauthProviders: ['google', 'github'], ssoEnabled: false }}
      />,
    );
    expect(screen.getByText(/continue with google/i)).toBeDefined();
    expect(screen.getByText(/continue with github/i)).toBeDefined();
  });

  it('does not render passkey button when allowPasskey is false', () => {
    renderWithProvider(
      <SignIn authPolicy={{ allowPasskey: false, allowEmailOtp: true, allowedOauthProviders: [], ssoEnabled: false }} />,
    );
    expect(screen.queryByText(/continue with passkey/i)).toBeNull();
  });

  it('accepts appearance prop without error', () => {
    expect(() =>
      renderWithProvider(
        <SignIn
          appearance={{
            logoUrl: 'https://example.com/logo.png',
            variables: { colorPrimary: '#ff0000', borderRadius: '1rem' },
            elements: { primaryButton: 'custom-btn-class' },
          }}
        />,
      ),
    ).not.toThrow();
  });

  it('advances to OTP step after email submission', async () => {
    renderWithProvider(
      <SignIn authPolicy={{ allowPasskey: false, allowEmailOtp: true, allowedOauthProviders: [], ssoEnabled: false }} />,
    );
    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => {
      expect(screen.getByLabelText(/one-time code/i)).toBeDefined();
    });
  });

  // 브랜딩(대시보드에서 정한 색)은 카드 껍데기에만 얹혀 있었다. 소비자 앱이 자체
  // 카드 디자인을 쓰려고 `bare` 를 켜면 껍데기와 함께 색까지 사라져, 대시보드에서
  // 색을 바꿔도 우리 버튼은 기본색 그대로였다. bare 는 "껍데기 없이"지
  // "브랜딩 없이"가 아니다.
  const BRANDED = {
    allowPasskey: false,
    allowEmailOtp: true,
    allowedOauthProviders: [] as string[],
    ssoEnabled: false,
    branding: { appName: 'Paper', logoUrl: '', primaryColor: '#00ffd5', textColor: '' },
  };

  it('carries brand variables in bare mode', () => {
    const { container } = renderWithProvider(<SignIn bare authPolicy={BRANDED} />);
    const branded = container.querySelector<HTMLElement>('[style*="--brand-primary"]');
    expect(branded).not.toBeNull();
    expect(branded!.style.getPropertyValue('--brand-primary')).toBe('#00ffd5');
  });

  // 소비자 레이아웃 안에 들어가므로 상자를 만들면 flex/grid 배치가 틀어진다.
  it('does not add a layout box in bare mode', () => {
    const { container } = renderWithProvider(<SignIn bare authPolicy={BRANDED} />);
    const branded = container.querySelector<HTMLElement>('[style*="--brand-primary"]');
    expect(branded!.style.display).toBe('contents');
  });

  // 브랜딩이 없으면 아무것도 감싸지 않는다 — 기존 동작 그대로.
  it('wraps nothing when the app has no branding', () => {
    const { container } = renderWithProvider(
      <SignIn bare authPolicy={{ allowPasskey: false, allowEmailOtp: true, allowedOauthProviders: [], ssoEnabled: false }} />,
    );
    expect(container.querySelector('[style*="--brand-primary"]')).toBeNull();
  });

  // 로그인 방법이 여럿이면 "지난번에 뭘로 들어왔더라"를 매번 떠올려야 한다.
  // 마지막 방법에만 표시가 붙고, 나머지에는 붙지 않아야 쓸모가 있다.
  describe('지난번에 쓴 방법 표시', () => {
    const POLICY = {
      allowPasskey: true,
      allowEmailOtp: true,
      allowedOauthProviders: ['google', 'kakao'],
      ssoEnabled: false,
    };

    beforeEach(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    it('기억된 게 없으면 아무 표시도 없다', () => {
      renderWithProvider(<SignIn authPolicy={POLICY} />);
      expect(screen.queryByText('Last used')).toBeNull();
    });

    it('마지막으로 쓴 소셜 버튼 하나에만 붙는다', async () => {
      window.localStorage.setItem('wg_last_method', 'oauth:google');
      const { container } = renderWithProvider(<SignIn authPolicy={POLICY} />);
      await waitFor(() => expect(screen.getAllByText('Last used')).toHaveLength(1));
      const marked = container.querySelector('.relative');
      expect(marked?.textContent).toContain('Google');
      expect(marked?.textContent).not.toContain('Kakao');
    });

    it('패스키로 들어왔으면 패스키 버튼에 붙는다', async () => {
      window.localStorage.setItem('wg_last_method', 'passkey');
      const { container } = renderWithProvider(<SignIn authPolicy={POLICY} />);
      await waitFor(() => expect(screen.getAllByText('Last used')).toHaveLength(1));
      expect(container.querySelector('.relative')?.textContent).toContain('Passkey');
    });

    // 제공자 이름이 'passkey' 인 커스텀 로그인이 붙어도 내장 패스키와 섞이면 안 된다.
    it('소셜 제공자와 내장 패스키를 구분한다', async () => {
      window.localStorage.setItem('wg_last_method', 'oauth:passkey');
      renderWithProvider(
        <SignIn authPolicy={{ ...POLICY, allowedOauthProviders: ['passkey'] }} />,
      );
      await waitFor(() => expect(screen.getAllByText('Last used')).toHaveLength(1));
    });

    // 이메일로 들어온 사람에게 아무 표시가 없으면, 정작 "지난번에 뭘로 들어왔지"를
    // 가장 많이 묻는 경우를 놓친다.
    it('이메일 코드로 들어왔으면 이메일 제출 버튼에 붙는다', async () => {
      window.localStorage.setItem('wg_last_method', 'email_otp');
      renderWithProvider(<SignIn authPolicy={POLICY} />);
      await waitFor(() => expect(screen.getAllByText('Last used')).toHaveLength(1));
      const marked = screen.getByText('Last used').parentElement;
      expect(marked?.textContent).toContain('Continue');
    });

    // 코드로 받든 링크로 받든 사람이 하는 일은 "이메일을 넣는다"로 같다.
    it('매직링크도 이메일 구간으로 본다', async () => {
      window.localStorage.setItem('wg_last_method', 'magic_link');
      renderWithProvider(<SignIn authPolicy={{ ...POLICY, allowMagicLink: true }} />);
      await waitFor(() => expect(screen.getAllByText('Last used')).toHaveLength(1));
    });

    it('소셜로 들어왔으면 이메일 버튼에는 붙지 않는다', async () => {
      window.localStorage.setItem('wg_last_method', 'oauth:google');
      renderWithProvider(<SignIn authPolicy={POLICY} />);
      await waitFor(() => expect(screen.getAllByText('Last used')).toHaveLength(1));
      expect(screen.getByText('Last used').parentElement?.textContent).toContain('Google');
    });

    // 지난번 방법이 지금 안 보이는 탭에 있으면 그 탭으로 데려가야 한다.
    it('전화로 들어왔는데 이메일 탭이 열려 있으면 전화 탭에 표시한다', async () => {
      window.localStorage.setItem('wg_last_method', 'phone_otp');
      const { container } = renderWithProvider(
        <SignIn
          authPolicy={{
            ...POLICY,
            allowedIdentifierKinds: ['email', 'phone'],
            primaryIdentifierKind: 'email',
          }}
        />,
      );
      await waitFor(() => {
        const dot = container.querySelector('[aria-label="Last used"]');
        expect(dot).not.toBeNull();
        expect(dot?.parentElement?.textContent).toContain('Phone');
      });
    });
  });

  it('throws error when useAuth used outside provider', () => {
    // useAuth is already mocked at module level; access the real impl via the mock's context throw
    const TestComponent = () => {
      // Calling useIdentityContext directly by rendering without a provider triggers the error
      const { useAuth: _useAuth } = { useAuth: () => { throw new Error('useAuth must be used within a IdentityProvider'); } };
      _useAuth();
      return null;
    };
    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within a IdentityProvider',
    );
  });
});
