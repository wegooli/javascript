import { PaperApiError, PaperClientError } from './errors';
import type {
  ClonedTemplate,
  CreatedTemplate,
  ListTemplatesQuery,
  PaperClientOptions,
  PaperTemplates,
  UpdatedTemplate,
  UpdateTemplateBody,
} from './types';

const API_KEY_HEADER = 'X-API-Key';
const OWNER_SCOPE_HEADER = 'X-Owner-Scope';

function assertBrowserSafe(options: PaperClientOptions): void {
  if (options.credential.type === 'service-key' && typeof window !== 'undefined') {
    throw new PaperClientError(
      'service_key_in_browser',
      '서비스 열쇠는 브라우저에 둘 수 없습니다. 열쇠는 파트너 서버에 두세요.',
    );
  }
}

function authHeaders(options: PaperClientOptions, json: boolean): Headers {
  const headers = new Headers();
  if (options.credential.type === 'service-key') {
    headers.set(API_KEY_HEADER, options.credential.apiKey);
  } else {
    const scheme = options.credential.scheme ?? 'Bearer';
    headers.set('Authorization', `${scheme} ${options.credential.token}`);
  }
  const scope = options.ownerScope?.trim();
  if (scope) headers.set(OWNER_SCOPE_HEADER, scope);
  if (json) headers.set('Content-Type', 'application/json');
  return headers;
}

async function errorFrom(response: Response, path: string): Promise<PaperApiError> {
  let code = 'http_error';
  let message = '';
  const text = await response.text();
  if (text) {
    try {
      const body = JSON.parse(text) as { error?: unknown; message?: unknown };
      if (typeof body.error === 'string' && body.error) code = body.error;
      if (typeof body.message === 'string') message = body.message;
      else if (typeof body.error === 'string') message = body.error;
    } catch {
      // JSON이 아니면 status만 담는다. 본문은 오류에 넣지 않는다.
      code = 'http_error';
      message = '';
    }
  }
  return new PaperApiError(response.status, code, message, path);
}

export function createPaperClient(options: PaperClientOptions): PaperTemplates {
  assertBrowserSafe(options);

  const fetchImpl = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const timeoutMs = options.timeoutMs ?? 10_000;

  async function send(path: string, init: RequestInit = {}, json = false): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        headers: authHeaders(options, json),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new PaperApiError(0, 'timeout', '서버 응답이 늦어 멈추었습니다.', path);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson<T>(response: Response, path: string): Promise<T> {
    if (!response.ok) throw await errorFrom(response, path);
    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  return {
    async listTemplates(query) {
      const path = listPath(query);
      const response = await send(path);
      return readJson(response, path);
    },

    async getTemplate(id) {
      const path = `/api/templates/${encodeURIComponent(id)}`;
      const response = await send(path);
      return readJson(response, path);
    },

    async getTemplatePdf(id) {
      const path = `/api/templates/${encodeURIComponent(id)}/pdf`;
      const response = await send(path);
      if (!response.ok) throw await errorFrom(response, path);
      return response.arrayBuffer();
    },

    async listParamKeys() {
      const path = '/api/templates/param-keys';
      const response = await send(path);
      return readJson(response, path);
    },

    async createTemplate(input) {
      const path = '/api/templates';
      const form = new FormData();
      form.set('file', input.file);
      form.set('title', input.title);
      if (input.description) form.set('description', input.description);
      if (input.fields) form.set('fieldsJson', JSON.stringify(input.fields));
      if (input.signers) form.set('signers', JSON.stringify(input.signers));
      if (input.thumbnail) form.set('thumbnail', input.thumbnail);
      if (input.category) form.set('category', input.category);
      const response = await send(path, { method: 'POST', body: form });
      return readJson<CreatedTemplate>(response, path);
    },

    async cloneTemplate(id, title) {
      const path = `/api/templates/${encodeURIComponent(id)}/clone`;
      const init: RequestInit = { method: 'POST' };
      const hasTitle = title !== undefined;
      if (hasTitle) init.body = JSON.stringify({ title });
      const response = await send(path, init, hasTitle);
      return readJson<ClonedTemplate>(response, path);
    },

    async updateTemplate(id, body) {
      const path = `/api/templates/${encodeURIComponent(id)}`;
      const response = await send(
        path,
        { method: 'PATCH', body: JSON.stringify(body satisfies UpdateTemplateBody) },
        true,
      );
      return readJson<UpdatedTemplate>(response, path);
    },
  };
}

function listPath(query: ListTemplatesQuery | undefined): string {
  const params = new URLSearchParams();
  if (query?.archived) params.set('archived', query.archived);
  if (query?.category) params.set('category', query.category);
  if (query?.tag) params.set('tag', query.tag);
  if (query?.source) params.set('source', query.source);
  const search = params.toString();
  return search ? `/api/templates?${search}` : '/api/templates';
}
