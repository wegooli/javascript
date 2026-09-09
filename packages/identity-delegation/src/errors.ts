/**
 * Identity 가 거절했을 때 던지는 오류.
 *
 * `code` 는 Identity 가 돌려준 기계용 값이고, `message` 는 사람이 읽을 값이다.
 * 둘을 나눠 두는 이유는 하나다 — 어떤 거절은 재시도로 풀리지 않고 사람이 다시
 * 눌러야 풀린다. 코드로 갈라야 그 둘을 구별할 수 있다.
 */
export class DelegationError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string;

  constructor(status: number, code: string, message: string, details?: string) {
    super(message);
    this.name = 'DelegationError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /**
   * 그 사람이 껐던 위임을 다시 만들려 했다는 뜻이다.
   *
   * 이건 오류가 아니라 **설계**다. 사람이 끈 위임을 백엔드가 조용히 다시 만들면
   * 그 사람이 누른 스위치는 아무것도 안 한 게 된다. 다시 켜려면 화면에서 사람이
   * 다시 동의를 누르고, 그 동의를 근거로 `reconsent: true` 를 보내야 한다.
   */
  get isRevokedByPrincipal(): boolean {
    return this.code === 'grant_revoked';
  }

  /** 진술이 거절됐다 — 서명·수신자·수명·발급자 중 하나가 조건을 못 맞췄다 */
  get isAssertionRejected(): boolean {
    return this.code.startsWith('assertion_') || this.code === 'issuer_not_trusted';
  }
}

/** 토큰 검사가 실패했을 때. 이유는 로그로만 남기고 호출자에게는 한 가지로 준다. */
export class TokenRejected extends Error {
  /** 왜 거절됐는지. 응답에 그대로 실어 보내지 말 것 — 공격자에게 힌트가 된다. */
  readonly reason: string;
  /** 위임이 취소돼서 거절됐는가. 이건 401 이 아니라 403 이다. */
  readonly revoked: boolean;

  constructor(reason: string, revoked = false) {
    super(`token rejected: ${reason}`);
    this.name = 'TokenRejected';
    this.reason = reason;
    this.revoked = revoked;
  }
}
