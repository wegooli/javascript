import type { FieldInputType, FieldType, PaperTemplates } from '@wegooli/paper-client';

/** 화면이 들고 있는 칸. 저장 직전에 서버 모양으로 좁힌다. */
export interface EditorField {
  id: string;
  pageNumber: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  required: boolean;
  type: FieldType;
  imageFileKey: string | null;
  imageMime: string | null;
  /** 미리보기 주소. 저장 본문에 넣지 않는다. */
  imageUrl: string | null;
  textContent: string | null;
  /** 페이지 높이의 퍼센트. 새 글자칸은 paper-core의 기본값이다. */
  fontSize: number | null;
  label: string | null;
  paramKey: string | null;
  signerSlot: number;
  inputType: FieldInputType | null;
  /** 날짜칸의 모양. 예: `YYYY년 M월 D일`. null이면 `YYYY-MM-DD`. */
  dateFormat: string | null;
}

export interface PageSize {
  width: number;
  height: number;
  paint?: (canvas: HTMLCanvasElement) => Promise<void>;
}

export interface EditorClassNames {
  root?: string;
  page?: string;
  box?: string;
  toolbar?: string;
  sidePanel?: string;
  primaryButton?: string;
}

/** 앱이 그림을 올린 결과. Paper `POST /api/upload/image`의 응답 모양이다. */
export interface UploadedImage {
  imageFileKey: string;
  imageMime: string;
  /** 미리보기 주소. 없으면 칸에 그림 대신 글자를 띄운다. */
  previewUrl?: string | null;
}

export interface TemplateEditorProps {
  client: PaperTemplates;
  templateId?: string;
  /** 아직 서버에 없는 PDF. templateId가 없을 때 저장은 새 양식을 만든다. */
  file?: File;
  /**
   * 양식 이름. 저장할 때 이 값을 보낸다. 바뀌어도 계약서를 다시 읽지 않는다.
   * 없으면 불러온 양식의 이름을 그대로 둔다.
   */
  title?: string;
  /** 양식 설명. 있을 때만 저장 본문에 넣는다. 빈 글자를 주면 설명이 지워진다. */
  description?: string;
  /**
   * 발송자가 실제로 보내는 이름. 있으면 서버의 사용 목록 대신 이 목록과 비교하고,
   * 목록 조회는 하지 않는다.
   */
  expectedParamKeys?: readonly string[];
  onSaved?: (id: string) => void;
  /** 칸이 바뀔 때마다 부른다. 받는 분 화면 미리보기처럼 앱이 칸을 따로 보여 줄 때 쓴다. */
  onFieldsChange?: (fields: readonly EditorField[]) => void;
  /**
   * 도장·그림을 올리는 일. 앱이 넘긴다. 없으면 도장·그림 놓기 단추가 나오지 않는다.
   * 열쇠가 필요한 앱은 자기 서버가 중계한다. 편집기는 열쇠를 모른다.
   */
  uploadImage?: (file: File) => Promise<UploadedImage>;
  classNames?: EditorClassNames;
  /** 테스트를 위해 페이지 크기를 직접 준다. 있으면 PDF를 해석하지 않는다. */
  pages?: readonly PageSize[];
}

export interface TemplatePreviewProps {
  client: PaperTemplates;
  templateId: string;
  classNames?: EditorClassNames;
  pages?: readonly PageSize[];
}
