/**
 * 인증 과정에서 던지는 오류.
 *
 * 여태 이 SDK 는 `new Error("BFF request failed (400): {\"error\":\"invalid_phone\"}")`
 * 처럼 사람이 읽을 수 없는 문장을 던졌고, SignIn 은 그걸 그대로 화면에 띄웠다.
 * 화면을 다른 언어로 옮기려면 "무슨 오류인가"를 문장이 아니라 값으로 알아야
 * 하므로, 여기서 `code` 를 붙인다.
 *
 * `message` 는 종전 형식을 그대로 유지한다 — 로그·디버깅에서 그 문자열을
 * 보고 있던 곳이 깨지지 않게 하기 위해서다. 사람에게 보여 줄 문장은
 * identity-ui 가 `code` 를 보고 만든다.
 */
export class IdentityError extends Error {
  /** 서버가 준 오류 코드(`invalid_phone` 등) 또는 SDK 가 붙인 코드. */
  readonly code?: string;
  /** HTTP 상태. 네트워크 이전 단계에서 난 오류면 없다. */
  readonly status?: number;
  /** `rate_limited` 일 때 서버가 알려 준 재시도까지의 초. */
  readonly retryAfter?: number;
  /** 서버가 덧붙인 기술 설명. 화면에 그대로 띄우지 않는다. */
  readonly details?: string;

  constructor(
    message: string,
    init: { code?: string; status?: number; retryAfter?: number; details?: string; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'IdentityError';
    this.code = init.code;
    this.status = init.status;
    this.retryAfter = init.retryAfter;
    this.details = init.details;
    // ES5 타깃으로 내려갈 때 instanceof 가 깨지는 것을 막는다.
    Object.setPrototypeOf(this, IdentityError.prototype);
  }
}

/** SDK 자체가 붙이는 코드 — 서버까지 가기 전에 결판나는 것들. */
export const IdentityErrorCodes = {
  sessionExpired: 'session_expired',
  webauthnUnavailable: 'webauthn_unavailable',
  passkeyCancelled: 'passkey_cancelled',
  passkeyNotAllowed: 'passkey_not_allowed',
  passkeyDuplicate: 'passkey_duplicate',
  passkeyInsecureContext: 'passkey_insecure_context',
  cryptoUnavailable: 'crypto_unavailable',
  network: 'network_error',
  unknown: 'unknown_error',
} as const;

/**
 * 브라우저가 던진 것을 포함해 무엇이 오든 `IdentityError` 로 맞춘다.
 *
 * 패스키에서 특히 중요하다. 사람이 지문/얼굴 확인 창을 닫으면
 * `navigator.credentials.get()` 이 `DOMException(NotAllowedError)` 로 거절하는데,
 * 그 문장은 브라우저가 만든 것이라 우리가 손댈 수 없다. 이름을 코드로 바꿔 두면
 * 화면이 우리 문장으로 안내할 수 있다.
 */
export function toIdentityError(err: unknown): IdentityError {
  if (err instanceof IdentityError) return err;

  if (isDomException(err)) {
    return new IdentityError(err.message || err.name, {
      code: domExceptionCode(err.name),
      cause: err,
    });
  }

  if (err instanceof TypeError) {
    // fetch 는 연결 자체가 안 되면 TypeError 로 거절한다.
    return new IdentityError(err.message, { code: IdentityErrorCodes.network, cause: err });
  }

  if (err instanceof Error) {
    return new IdentityError(err.message, { cause: err });
  }

  return new IdentityError(String(err), { code: IdentityErrorCodes.unknown });
}

function isDomException(err: unknown): err is DOMException {
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) return true;
  // jsdom/노드 환경에서 DOMException 이 전역에 없을 수 있어 모양으로도 본다.
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    'message' in err &&
    typeof (err as { name: unknown }).name === 'string' &&
    DOM_EXCEPTION_NAMES.has((err as { name: string }).name)
  );
}

const DOM_EXCEPTION_NAMES = new Set([
  'NotAllowedError',
  'AbortError',
  'InvalidStateError',
  'SecurityError',
  'NotSupportedError',
  'ConstraintError',
  'UnknownError',
]);

function domExceptionCode(name: string): string {
  switch (name) {
    // 사람이 창을 닫았거나, 열어 둔 채 시간이 지났다. 실패가 아니라 "안 했다".
    case 'NotAllowedError':
    case 'AbortError':
      return IdentityErrorCodes.passkeyCancelled;
    // 이 기기에 이미 등록된 패스키가 있다.
    case 'InvalidStateError':
      return IdentityErrorCodes.passkeyDuplicate;
    // https 가 아니거나 도메인이 맞지 않는다.
    case 'SecurityError':
      return IdentityErrorCodes.passkeyInsecureContext;
    case 'NotSupportedError':
      return IdentityErrorCodes.webauthnUnavailable;
    default:
      return IdentityErrorCodes.passkeyNotAllowed;
  }
}
