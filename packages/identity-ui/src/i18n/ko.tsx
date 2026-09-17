import type { AuthLabels } from './types';

/**
 * 한국어 문구 — 이 화면들의 기본값.
 *
 * 읽는 사람은 개발자가 아니라 앱을 쓰는 사람(임대인·세입자)이다. 그래서
 * `publishable_key` 같은 코드 이름은 이 화면에 나오지 않고, 오류도 "무엇을
 * 하면 되는지"로 끝난다.
 *
 * 조사(로/으로)는 앞말에 따라 달라진다. 값이 들어가는 문장은 조사가 값에
 * 바로 붙지 않도록 짰다 — `{이메일} 주소로` 처럼 고정된 낱말 뒤에 붙인다.
 * 그러면 어떤 값이 와도 문장이 어색해지지 않는다.
 */
export const ko: AuthLabels = {
  common: {
    divider: '또는',
    emailLabel: '이메일 주소',
    emailPlaceholder: 'you@example.com',
    phoneLabel: '휴대폰 번호',
    phonePlaceholder: '+82 10 1234 5678',
    emailTab: '이메일',
    phoneTab: '휴대폰',
    submit: '계속',
    otpLabel: '일회용 코드',
    otpPlaceholder: '123456',
    verifyOtp: '확인',
    otpSentToEmail: (target) => <>{target} 주소로 보낸 일회용 코드를 넣어 주세요.</>,
    otpSentToPhone: (target) => <>{target} 번호로 보낸 일회용 코드를 넣어 주세요.</>,
    restartEmail: '이메일 주소 다시 넣기',
    restartPhone: '휴대폰 번호 다시 넣기',
    lastUsed: '지난번에 사용',
  },

  signIn: {
    title: '로그인',
    passkey: '패스키로 로그인',
    continueWithProvider: (name) => `${name} 계정으로 로그인`,
    magicLinkSubmit: '로그인 링크 받기',
    switchToMagicLink: '대신 로그인 링크를 메일로 받기 →',
    switchToOtp: '← 대신 일회용 코드로 받기',
    magicLinkSent: (target) => <>{target} 주소로 로그인 링크를 보냈습니다. 메일함을 확인해 주세요.</>,
    magicLinkNote: '링크는 15분이 지나면 쓸 수 없고, 한 번만 쓸 수 있습니다.',
    magicLinkUseAnother: '다른 주소로 다시 보내기',
  },

  signUp: {
    title: '계정 만들기',
    passkey: '패스키로 가입',
    continueWithProvider: (name) => `${name} 계정으로 가입`,
  },

  mfa: {
    title: '2단계 인증',
    prompt: (target) =>
      target ? (
        <>{target} 계정으로 로그인합니다. 인증 앱에 뜬 여섯 자리 숫자를 넣어 주세요.</>
      ) : (
        <>로그인을 마치려면 인증 앱에 뜬 여섯 자리 숫자를 넣어 주세요.</>
      ),
    codeLabel: '인증 코드',
    submit: '확인',
  },

  errors: {
    fallback: '문제가 생겼습니다. 잠시 뒤에 다시 시도해 주세요.',
    rateLimited: (seconds) => {
      if (!seconds || seconds < 1) return '너무 자주 시도했습니다. 잠시 뒤에 다시 시도해 주세요.';
      if (seconds < 60) return `너무 자주 시도했습니다. ${seconds}초 뒤에 다시 시도해 주세요.`;
      const minutes = Math.ceil(seconds / 60);
      if (minutes < 60) return `너무 자주 시도했습니다. ${minutes}분 뒤에 다시 시도해 주세요.`;
      return `너무 자주 시도했습니다. ${Math.ceil(minutes / 60)}시간 뒤에 다시 시도해 주세요.`;
    },
    byCode: {
      // 사람이 고칠 수 있는 것
      account_not_found: '등록된 계정이 없습니다. 가입하기에서 새 계정을 만드세요.',
      account_exists: '이미 계정이 있습니다. 로그인하세요.',
      invalid_email: '이메일 주소 형식이 맞지 않습니다. 다시 확인해 주세요.',
      invalid_phone: '휴대폰 번호 형식이 맞지 않습니다. 국가번호(+82)까지 넣어 주세요.',
      invalid_body: '넣은 내용을 다시 확인해 주세요.',
      verify_failed: '코드가 맞지 않거나 시간이 지났습니다. 코드를 다시 받아 주세요.',
      unauthorized: '로그인 정보가 맞지 않습니다. 다시 시도해 주세요.',

      // 매직링크 — 한 번 쓰면 끝나는 링크라 "이미 썼다"가 가장 흔하다
      invalid_token: '이 링크는 이미 썼거나 시간이 지났습니다. 링크를 다시 받아 주세요.',
      token_required: '링크가 온전하지 않습니다. 메일에 있는 링크를 다시 눌러 주세요.',
      org_mismatch: '이 링크는 다른 서비스에서 보낸 것입니다. 이 화면에서 다시 로그인해 주세요.',

      // 패스키
      webauthn_unavailable: '이 브라우저에서는 패스키를 쓸 수 없습니다. 이메일로 로그인해 주세요.',
      passkey_cancelled: '패스키 확인이 취소됐습니다. 다시 시도하거나 이메일로 로그인해 주세요.',
      passkey_not_allowed: '패스키를 쓸 수 없습니다. 이메일로 로그인해 주세요.',
      passkey_duplicate: '이 기기에는 이미 패스키가 등록돼 있습니다.',
      passkey_insecure_context: '보안 연결(https)에서만 패스키를 쓸 수 있습니다.',
      invalid_credential: '패스키를 확인하지 못했습니다. 다시 시도해 주세요.',

      // 기다렸다 다시 하면 되는 것
      send_failed: '보내지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',
      create_failed: '로그인 링크를 만들지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',
      session_failed: '로그인을 마치지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',
      auth_failed: '로그인을 마치지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',
      begin_failed: '로그인을 시작하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',
      register_failed: '등록하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',
      network_error: '연결하지 못했습니다. 인터넷 상태를 확인하고 다시 시도해 주세요.',
      session_expired: '로그인이 풀렸습니다. 다시 로그인해 주세요.',
      crypto_unavailable: '이 브라우저에서는 로그인을 시작할 수 없습니다. 최신 브라우저에서 다시 시도해 주세요.',

      // 사람이 아니라 앱 설정이 잘못된 것 — 사용자가 할 수 있는 일이 없으므로
      // 무엇을 하라고 하지 않고, 알릴 곳을 알려 준다.
      publishable_key_required: '이 앱의 로그인 설정이 올바르지 않습니다. 서비스 담당자에게 알려 주세요.',
      redirect_not_allowed: '돌아올 주소가 허용돼 있지 않습니다. 서비스 담당자에게 알려 주세요.',
      invalid_session_data: '로그인 과정이 끊겼습니다. 처음부터 다시 시도해 주세요.',
    },
  },
};
