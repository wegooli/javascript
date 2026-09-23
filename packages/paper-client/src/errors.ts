/**
 * 클라이언트를 만들 수 없을 때. 서버가 거절한 것과는 다르다.
 * 예: 브라우저에서 서비스 열쇠로 만들려고 한 경우.
 */
export class PaperClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PaperClientError';
    this.code = code;
  }
}

/**
 * 양식 서버가 거절했거나, 시간 안에 답이 없을 때.
 *
 * `code`는 서버가 준 기계용 값이고, `message`는 사람이 읽을 값이다.
 * 요청 헤더와 열쇠는 여기에 넣지 않는다.
 */
export class PaperApiError extends PaperClientError {
  readonly status: number;
  readonly path: string;

  constructor(status: number, code: string, message: string, path: string) {
    super(code, message);
    this.name = 'PaperApiError';
    this.status = status;
    this.path = path;
  }
}
