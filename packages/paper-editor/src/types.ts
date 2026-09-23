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

export interface TemplateEditorProps {
  client: PaperTemplates;
  templateId?: string;
  /** 아직 서버에 없는 PDF. templateId가 없을 때 저장은 새 양식을 만든다. */
  file?: File;
  title?: string;
  /**
   * 발송자가 실제로 보내는 이름. 있으면 서버의 사용 목록 대신 이 목록과 비교하고,
   * 목록 조회는 하지 않는다.
   */
  expectedParamKeys?: readonly string[];
  onSaved?: (id: string) => void;
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
