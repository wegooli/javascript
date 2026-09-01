/**
 * dist/styles.css 를 만드는 전용 설정. 소비자에게 배포되지 않는다.
 *
 * 핵심은 important 스코프다. `.wg-identity` 후손으로 한정해서
 *   - 소비자 앱의 같은 이름 클래스를 건드리지 않고
 *   - 소비자가 간격 스케일을 다르게 정의해 뒀어도(예: p-4 를 32px 로) 후손
 *     선택자의 높은 명시도 덕에 이 라이브러리는 의도한 값으로 그려진다
 *
 * preflight 는 끈다. 소비자 앱 전체의 기본 스타일을 초기화하면 안 된다.
 */
const preset = require('./tailwind.preset.js');

module.exports = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
  important: '.wg-identity',
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
