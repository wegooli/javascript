import React from 'react';
import { describeError, errorCode } from '../i18n';
import type { AuthLabels } from '../i18n/types';

export interface ErrorBannerProps {
  error: unknown;
  labels: AuthLabels;
}

/**
 * 로그인 화면들이 공유하는 오류 표시.
 *
 * 보여 주는 문장은 오류 코드로 고른 우리 말이고, 서버가 준 원문은 화면에
 * 나오지 않는다. 코드는 `data-error-code` 로만 남겨 둔다 — 개발자 도구에서는
 * 무엇이 났는지 그대로 보이지만, 앱을 쓰는 사람 눈에는 안 띈다.
 *
 * `role="alert"` 이라 화면을 읽어 주는 도구가 바뀐 순간 읽어 준다.
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, labels }) => {
  const message = describeError(error, labels);
  if (!message) return null;
  return (
    <div
      role="alert"
      data-error-code={errorCode(error) ?? 'unknown'}
      className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100"
    >
      {message}
    </div>
  );
};
