export type FieldType = 'SIGNATURE' | 'IMAGE' | 'TEXT';

export type FieldInputType = 'TEXT' | 'DATE' | 'NUMBER' | 'CHECKBOX';

/** 서버에 저장하는 칸. 미리보기용 주소(imageUrl)는 넣지 않는다. */
export interface TemplateFieldInput {
  pageNumber: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  required?: boolean;
  type?: FieldType;
  imageFileKey?: string;
  imageMime?: string;
  textContent?: string;
  /** 페이지 높이의 퍼센트. pt가 아니다. */
  fontSize?: number;
  label?: string | null;
  paramKey?: string | null;
  /** 1부터. 서명란에만 뜻이 있다. */
  signerSlot?: number;
  inputType?: FieldInputType;
}

/** 서버가 돌려준 칸. id와 imageUrl은 다시 저장할 때 빼야 한다. */
export interface TemplateField {
  id?: string;
  pageNumber: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  required?: boolean;
  type?: FieldType;
  imageFileKey?: string | null;
  imageMime?: string | null;
  imageUrl?: string | null;
  textContent?: string | null;
  fontSize?: number | null;
  label?: string | null;
  paramKey?: string | null;
  signerSlot?: number;
  inputType?: FieldInputType | null;
}

export interface TemplateSigner {
  slot: number;
  role: string;
}

export interface TemplateSummary {
  id: string;
  title: string;
  description?: string | null;
  pageCount?: number;
  fieldCount?: number;
  signatureFieldCount?: number;
  source?: 'SYSTEM' | 'COMPANY';
  signers?: TemplateSigner[];
}

export interface TemplateDetail {
  id: string;
  title: string;
  description?: string | null;
  pageCount: number;
  source?: 'SYSTEM' | 'COMPANY';
  pdfUrl?: string | null;
  fields: TemplateField[];
  signers?: TemplateSigner[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ParamKeyEntry {
  key: string;
  label: string | null;
  useCount: number;
}

export interface ListTemplatesQuery {
  archived?: 'only' | 'all';
  category?: string;
  tag?: string;
  source?: 'SYSTEM' | 'COMPANY';
}

export interface CreateTemplateInput {
  file: Blob;
  title: string;
  description?: string;
  fields?: TemplateFieldInput[];
  signers?: TemplateSigner[];
  thumbnail?: Blob | null;
  category?: string;
}

export interface UpdateTemplateBody {
  title?: string;
  description?: string;
  fields?: TemplateFieldInput[];
  /**
   * 이 키를 아예 안 보내야 서버가 서명 자리 이름을 그대로 둔다.
   * 빈 배열을 보내면 지워진다. 편집기는 이 키를 넣지 않는다.
   */
  signers?: TemplateSigner[];
}

export interface CreatedTemplate {
  id: string;
  title: string;
  pageCount?: number;
  createdAt?: string;
}

export interface ClonedTemplate {
  id: string;
  title: string;
}

export interface UpdatedTemplate {
  id: string;
  title?: string;
  updatedAt?: string;
}

/**
 * 화면이 아는 전부. 주소와 헤더는 여기 없다.
 * 파트너 서버가 같은 모양으로 중계해도 화면은 바꾸지 않는다.
 */
export interface PaperTemplates {
  listTemplates(query?: ListTemplatesQuery): Promise<TemplateSummary[]>;
  getTemplate(id: string): Promise<TemplateDetail>;
  getTemplatePdf(id: string): Promise<ArrayBuffer>;
  listParamKeys(): Promise<{ keys: ParamKeyEntry[] }>;
  createTemplate(input: CreateTemplateInput): Promise<CreatedTemplate>;
  cloneTemplate(id: string, title?: string): Promise<ClonedTemplate>;
  updateTemplate(id: string, body: UpdateTemplateBody): Promise<UpdatedTemplate>;
}

export type Credential =
  | { type: 'service-key'; apiKey: string }
  | { type: 'delegation'; token: string; scheme?: 'Bearer' | 'DPoP' };

export interface PaperClientOptions {
  /** 끝의 슬래시는 빼도 되고 있어도 된다. */
  baseUrl: string;
  credential: Credential;
  /**
   * 있으면 X-Owner-Scope로 그대로 보낸다. 쪼개거나 지어내지 않는다.
   * 없으면 헤더를 만들지 않는다.
   */
  ownerScope?: string | null;
  fetch?: typeof globalThis.fetch;
  /** 한 요청의 제한 시간(ms). 기본 10초. */
  timeoutMs?: number;
}
