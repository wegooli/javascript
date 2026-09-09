import { useMemo } from 'react';
import type { OrgAuthPolicy } from '@wegooli/identity-types';
import { ko } from './ko';
import { en } from './en';
import type { AuthLabels, AuthLocale, PartialAuthLabels } from './types';

export type {
  AuthLabels,
  AuthLocale,
  PartialAuthLabels,
  LocalizableProps,
  CommonLabels,
  SignInLabels,
  SignUpLabels,
  MFALabels,
  AuthErrorLabels,
} from './types';
export { ko, en };

/** 준비된 언어. */
export const authLocales: Record<AuthLocale, AuthLabels> = { ko, en };

/** 아무것도 정해지지 않았을 때의 언어. */
export const DEFAULT_AUTH_LOCALE: AuthLocale = 'ko';

/**
 * 어떤 언어로 그릴지 정한다. 앞의 것이 이긴다.
 *
 *  1. 컴포넌트에 넘긴 `locale`
 *  2. 앱 설정에 적힌 언어 (`authPolicy.branding.locale`) — 대시보드에서 고르면
 *     고객사가 코드를 안 고치고 바꿀 수 있다. BFF 는 "정하지 않음"을 빈 문자열로
 *     보내므로 빈 값은 없는 것으로 본다.
 *  3. 한국어
 */
export function resolveLocale(locale?: AuthLocale, policy?: OrgAuthPolicy | null): AuthLocale {
  if (locale && locale in authLocales) return locale;
  const fromPolicy = policy?.branding?.locale;
  if (fromPolicy && fromPolicy in authLocales) return fromPolicy as AuthLocale;
  return DEFAULT_AUTH_LOCALE;
}

/**
 * 고른 언어에 소비자가 넘긴 `labels` 를 덮어쓴다.
 *
 * 묶음(common·signIn·…) 단위로 얕게 합친다. 소비자가 버튼 하나만 바꾸고
 * 싶을 때 나머지를 다 적지 않아도 되게 하기 위해서다. 오류 문장 표
 * (`errors.byCode`)는 한 겹 더 들어가므로 따로 합친다.
 */
export function mergeLabels(base: AuthLabels, overrides?: PartialAuthLabels): AuthLabels {
  if (!overrides) return base;
  const { errors: errorOverrides, ...rest } = overrides;
  const merged: AuthLabels = {
    ...base,
    common: { ...base.common, ...rest.common },
    signIn: { ...base.signIn, ...rest.signIn },
    signUp: { ...base.signUp, ...rest.signUp },
    mfa: { ...base.mfa, ...rest.mfa },
  };
  if (errorOverrides) {
    merged.errors = {
      ...base.errors,
      ...errorOverrides,
      byCode: { ...base.errors.byCode, ...errorOverrides.byCode },
    };
  }
  return merged;
}

/** 컴포넌트가 쓰는 형태. prop 이 안 바뀌면 같은 객체를 돌려준다. */
export function useAuthLabels(
  locale?: AuthLocale,
  overrides?: PartialAuthLabels,
  policy?: OrgAuthPolicy | null,
): AuthLabels {
  const resolved = resolveLocale(locale, policy);
  return useMemo(() => mergeLabels(authLocales[resolved], overrides), [resolved, overrides]);
}

/**
 * 오류를 사람이 읽을 한 문장으로 바꾼다.
 *
 * 종전에는 `error.message` 를 그대로 띄웠다. 그 문장은
 * `BFF request failed (400): {"error":"invalid_phone"}` 같은 모양이라, 앱을
 * 쓰는 사람에게는 아무 뜻도 없고 고칠 방법도 알려 주지 못했다.
 *
 * 모르는 오류는 원문을 보여 주지 않고 일반 안내로 덮는다 — 사람에게 서버
 * 내부 사정을 보여 봐야 할 수 있는 일이 없기 때문이다. 대신 배너에
 * `data-error-code` 를 달아 두므로, 개발자는 개발자 도구에서 코드를 볼 수 있다.
 */
export function describeError(error: unknown, labels: AuthLabels): string | null {
  if (!error) return null;
  const code = errorCode(error);
  if (code === 'rate_limited') {
    return labels.errors.rateLimited(retryAfterOf(error));
  }
  if (code && labels.errors.byCode[code]) return labels.errors.byCode[code];
  return labels.errors.fallback;
}

/** 배너에 달아 두는 진단용 값. 화면에는 보이지 않는다. */
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function retryAfterOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const n = (error as { retryAfter?: unknown }).retryAfter;
  return typeof n === 'number' ? n : undefined;
}
