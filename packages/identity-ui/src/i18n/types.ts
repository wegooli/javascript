import type React from 'react';
import type { AuthLocale } from '@wegooli/identity-types';

export type { AuthLocale };

/**
 * 화면에 나오는 모든 문구.
 *
 * 규칙 두 가지를 지킨다 (핸드오프 20- 문서 §1):
 *
 *  - **문장을 이어 붙여 만들지 않는다.** 값이 문장 가운데 들어가야 하면 그
 *    문장 전체를 하나의 함수로 둔다. `'총 ' + n + '개'` 처럼 조각을 이으면
 *    어순이 다른 언어에서 문장이 무너진다.
 *  - **문구는 한곳에 모은다.** 컴포넌트 안에 하드코딩된 문자열을 두지 않는다.
 *
 * 값이 들어가는 자리는 `React.ReactNode` 를 받는다. 이메일 주소처럼 강조해서
 * 보여 줄 것이 있어서인데, 강조를 어떻게 할지(굵게·색)는 컴포넌트가 정하고
 * 사전은 그 자리가 문장 어디에 오는지만 정한다.
 */
export interface AuthLabels {
  common: CommonLabels;
  signIn: SignInLabels;
  signUp: SignUpLabels;
  mfa: MFALabels;
  errors: AuthErrorLabels;
}

export interface CommonLabels {
  /** 위쪽 방법들과 이메일 입력 사이의 구분선 글자. */
  divider: string;
  /**
   * `methodOrder="email-first"` 일 때, 이메일 아래로 내려간 패스키·소셜 위에
   * 놓이는 구분선 글자. 「또는」과 다른 말이어야 한다 — 그 수단들은 **한 번
   * 로그인한 뒤에야** 쓸 수 있어서, 처음 오는 사람에게는 고를 것이 아니다.
   */
  registeredDivider: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  /**
   * 서버(SMS 발송)가 E.164 형식을 요구한다 — `+82` 로 시작하지 않으면
   * 문자가 나가지 않는다. 그래서 예시도 그 형식으로 둔다.
   */
  phonePlaceholder: string;
  emailTab: string;
  phoneTab: string;
  submit: string;
  otpLabel: string;
  otpPlaceholder: string;
  verifyOtp: string;
  /** 코드를 보낸 뒤의 안내. 받는 곳이 이메일일 때와 전화일 때를 나눈다. */
  otpSentToEmail: (target: React.ReactNode) => React.ReactNode;
  otpSentToPhone: (target: React.ReactNode) => React.ReactNode;
  /** 코드 입력 화면에서 주소/번호를 다시 넣으러 돌아가는 버튼. */
  restartEmail: string;
  restartPhone: string;
  /** 지난번에 쓴 방법 표시. */
  lastUsed: string;
}

export interface SignInLabels {
  title: string;
  passkey: string;
  /** 소셜 로그인 버튼. 제공자 이름이 들어간다. */
  continueWithProvider: (providerName: string) => string;
  magicLinkSubmit: string;
  switchToMagicLink: string;
  switchToOtp: string;
  magicLinkSent: (target: React.ReactNode) => React.ReactNode;
  magicLinkNote: string;
  magicLinkUseAnother: string;
}

export interface SignUpLabels {
  title: string;
  passkey: string;
  /**
   * 가입 화면의 소셜 버튼. 로그인 쪽과 따로 두는 이유는 한국어에서
   * "로그인"과 "가입"이 다른 낱말이기 때문이다 — 영어 `Continue with …` 는
   * 양쪽에 다 쓸 수 있어서 한 벌로 써도 티가 안 났다.
   */
  continueWithProvider: (providerName: string) => string;
}

export interface MFALabels {
  title: string;
  /** 로그인 중인 계정을 알 수 있을 때만 target 이 들어온다. */
  prompt: (target: React.ReactNode | null) => React.ReactNode;
  codeLabel: string;
  submit: string;
}

export interface AuthErrorLabels {
  /** 모르는 오류일 때 보여 줄 문장. 서버 원문을 사람에게 보이지 않는다. */
  fallback: string;
  /** 오류 코드 → 사람이 읽을 문장. */
  byCode: Record<string, string>;
  /**
   * 너무 자주 눌렀을 때. 서버가 "몇 초 뒤"를 알려 주므로 문장 안에 넣는다.
   * 초를 분으로 바꿔 읽는 방식이 언어마다 다르니 사전이 직접 만든다.
   */
  rateLimited: (retryAfterSeconds?: number) => string;
}

/** `labels` prop 으로 넘길 수 있는 부분 덮어쓰기. */
export type PartialAuthLabels = {
  [K in keyof AuthLabels]?: K extends 'errors'
    ? Partial<Omit<AuthErrorLabels, 'byCode'>> & { byCode?: Record<string, string> }
    : Partial<AuthLabels[K]>;
};

/** 문구를 받는 컴포넌트가 공통으로 갖는 prop. */
export interface LocalizableProps {
  /**
   * 화면 언어. 넘기지 않으면 앱 설정(`authPolicy.branding.locale`)을 따르고,
   * 그것도 없으면 한국어다.
   */
  locale?: AuthLocale;
  /**
   * 문구 일부만 바꾸고 싶을 때. 여기 넣은 것이 `locale` 보다 우선한다.
   * 넘기지 않은 문구는 `locale` 의 것을 그대로 쓴다.
   */
  labels?: PartialAuthLabels;
}
