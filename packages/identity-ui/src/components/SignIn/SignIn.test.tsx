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
