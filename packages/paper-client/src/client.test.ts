import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPaperClient } from './client';
import { PaperApiError, PaperClientError } from './errors';

const SECRET = 'sk_live_test_secret';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  delete (globalThis as { window?: unknown }).window;
});

function headersOf(fetchMock: ReturnType<typeof vi.fn>): Headers {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return new Headers(init.headers);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('자격', () => {
  it('서비스 열쇠는 X-API-Key만 붙이고 Authorization은 없다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 't1', title: '임대차', pageCount: 1, fields: [] }));
    const client = createPaperClient({
      baseUrl: 'https://paper.example/',
      credential: { type: 'service-key', apiKey: SECRET },
      fetch: fetchMock,
    });

    await client.getTemplate('t1');

    const headers = headersOf(fetchMock);
    expect(headers.get('X-API-Key')).toBe(SECRET);
    expect(headers.get('Authorization')).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://paper.example/api/templates/t1');
  });

  it('위임 토큰은 Bearer만 붙이고 열쇠 헤더는 없다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ keys: [] }));
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 'delegated-token' },
      fetch: fetchMock,
    });

    await client.listParamKeys();

    const headers = headersOf(fetchMock);
    expect(headers.get('Authorization')).toBe('Bearer delegated-token');
    expect(headers.get('X-API-Key')).toBeNull();
  });

  it('DPoP 스킴을 지정하면 그 스킴만 쓴다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 'bound', scheme: 'DPoP' },
      fetch: fetchMock,
    });

    await client.listTemplates();

    expect(headersOf(fetchMock).get('Authorization')).toBe('DPoP bound');
    expect(headersOf(fetchMock).get('X-API-Key')).toBeNull();
  });

  it('ownerScope는 그대로 싣고, 없으면 헤더를 만들지 않는다', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ keys: [] })));
    const withScope = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 't' },
      ownerScope: 'spacenote:building:abc',
      fetch: fetchMock,
    });
    await withScope.listParamKeys();
    const headers = headersOf(fetchMock);
    expect(headers.get('X-Owner-Scope')).toBe('spacenote:building:abc');
    expect(headers.get('X-On-Behalf-Of')).toBeNull();
    expect(headers.get('X-Service-Id')).toBeNull();
    expect([...headers.keys()].some((name) => name.toLowerCase().includes('organization'))).toBe(false);

    fetchMock.mockClear();
    const withoutScope = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'service-key', apiKey: SECRET },
      fetch: fetchMock,
    });
    await withoutScope.listParamKeys();
    expect(headersOf(fetchMock).get('X-Owner-Scope')).toBeNull();
  });

  it('브라우저에서 서비스 열쇠 클라이언트는 요청 없이 거절한다', () => {
    (globalThis as { window?: unknown }).window = {};
    const fetchMock = vi.fn();
    expect(() =>
      createPaperClient({
        baseUrl: 'https://paper.example',
        credential: { type: 'service-key', apiKey: SECRET },
        fetch: fetchMock,
      }),
    ).toThrow(PaperClientError);
    try {
      createPaperClient({
        baseUrl: 'https://paper.example',
        credential: { type: 'service-key', apiKey: SECRET },
        fetch: fetchMock,
      });
    } catch (error) {
      expect(String(error)).not.toContain(SECRET);
      expect((error as PaperClientError).code).toBe('service_key_in_browser');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('브라우저에서도 위임 토큰은 만든다', () => {
    (globalThis as { window?: unknown }).window = {};
    const fetchMock = vi.fn();
    expect(() =>
      createPaperClient({
        baseUrl: 'https://paper.example',
        credential: { type: 'delegation', token: 't' },
        fetch: fetchMock,
      }),
    ).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('양식 호출', () => {
  it('PDF는 JSON으로 읽지 않고 바이트로 돌려준다', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
    );
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 't' },
      fetch: fetchMock,
    });

    const pdf = await client.getTemplatePdf('abc');

    expect(new Uint8Array(pdf)).toEqual(bytes);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/templates/abc/pdf');
  });

  it('기본 제공 양식 거절은 코드로 갈라지고 다시 보내지 않는다', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          {
            error: 'system_template_readonly',
            message: '기본 제공 양식은 고칠 수 없습니다. 우리 회사 양식으로 복사한 뒤 고치세요.',
          },
          403,
        ),
      ),
    );
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 't' },
      fetch: fetchMock,
    });

    await expect(client.updateTemplate('sys', { fields: [] })).rejects.toMatchObject({
      name: 'PaperApiError',
      status: 403,
      code: 'system_template_readonly',
      message: '기본 제공 양식은 고칠 수 없습니다. 우리 회사 양식으로 복사한 뒤 고치세요.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(client.updateTemplate('sys', { fields: [] })).rejects.toBeInstanceOf(PaperApiError);
  });

  it('고치기 본문에 서명 자리 이름과 회사 번호를 끼워 넣지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 't1', title: '임대차' }));
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 't' },
      fetch: fetchMock,
    });

    await client.updateTemplate('t1', { title: '임대차', fields: [] });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const sent = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(sent).not.toHaveProperty('signers');
    expect(sent).not.toHaveProperty('organizationId');
    expect(headersOf(fetchMock).get('Content-Type')).toBe('application/json');
  });

  it('새 양식은 파일을 보내고 출처나 회사 번호를 본문에 넣지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'new', title: '임대차' }, 201));
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'service-key', apiKey: SECRET },
      ownerScope: 'spacenote:building:abc',
      fetch: fetchMock,
    });
    const file = new Blob(['%PDF'], { type: 'application/pdf' });

    await client.createTemplate({
      file,
      title: '임대차',
      fields: [{ pageNumber: 1, posX: 1, posY: 2, width: 3, height: 4, type: 'SIGNATURE' }],
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('title')).toBe('임대차');
    expect(form.get('source')).toBeNull();
    expect(form.get('organizationId')).toBeNull();
    expect(form.get('signers')).toBeNull();
    expect(JSON.parse(String(form.get('fieldsJson')))).toEqual([
      { pageNumber: 1, posX: 1, posY: 2, width: 3, height: 4, type: 'SIGNATURE' },
    ]);
    expect(headersOf(fetchMock).get('Content-Type')).toBeNull();
    expect(headersOf(fetchMock).get('X-Owner-Scope')).toBe('spacenote:building:abc');
  });

  it('복사는 제목이 없으면 본문 없이 보내고, 있으면 JSON으로 보낸다', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse({ id: 'copy', title: '임대차 사본' }, 201)));
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 't' },
      fetch: fetchMock,
    });

    await client.cloneTemplate('sys');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).body).toBeUndefined();

    await client.cloneTemplate('sys', '우리 양식');
    expect(JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toEqual({
      title: '우리 양식',
    });
  });

  it('JSON이 아닌 거절은 상태만 남기고 본문은 담지 않는다', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response('<html>secret-page</html>', { status: 502 })));
    const client = createPaperClient({
      baseUrl: 'https://paper.example',
      credential: { type: 'delegation', token: 't' },
      fetch: fetchMock,
    });

    await expect(client.getTemplate('t1')).rejects.toMatchObject({
      status: 502,
      code: 'http_error',
      message: '',
    });
    try {
      await client.getTemplate('t1');
    } catch (error) {
      expect(String(error)).not.toContain('secret-page');
    }
  });
});
