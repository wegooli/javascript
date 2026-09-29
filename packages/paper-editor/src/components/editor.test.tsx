import '@testing-library/jest-dom/vitest';

import { percentBoxToTopLeft } from '@wegooli/paper-core';
import { PaperApiError, type PaperTemplates, type TemplateDetail } from '@wegooli/paper-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { SIGNATURE_BOX_PX, TEXT_BOX_PX, centeredPercent } from '../placement';

const pages = [{ width: 500, height: 1000 }];

function detail(patch: Partial<TemplateDetail>): TemplateDetail {
  return {
    id: 't1',
    title: '임대차',
    pageCount: 1,
    source: 'COMPANY',
    fields: [],
    ...patch,
  };
}

function client(overrides: Partial<PaperTemplates> = {}): PaperTemplates {
  return {
    listTemplates: vi.fn(),
    getTemplate: vi.fn().mockResolvedValue(detail({})),
    getTemplatePdf: vi.fn(),
    listParamKeys: vi.fn().mockResolvedValue({ keys: [] }),
    createTemplate: vi.fn().mockResolvedValue({ id: 'new', title: '계약서' }),
    cloneTemplate: vi.fn(),
    updateTemplate: vi.fn().mockResolvedValue({ id: 't1', title: '임대차' }),
    ...overrides,
  };
}

describe('계약서 화면', () => {
  it('칸의 화면 위치는 퍼센트를 뒤집지 않은 값이다', async () => {
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'sign',
              pageNumber: 1,
              posX: 10,
              posY: 20,
              width: 30,
              height: 10,
              type: 'SIGNATURE',
              signerSlot: 1,
            },
          ],
        }),
      ),
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    const box = await screen.findByRole('button', { name: '서명란' });
    const placed = percentBoxToTopLeft({ posX: 10, posY: 20, width: 30, height: 10 }, 500, 1000);
    expect(box).toHaveStyle({
      left: `${placed.x}px`,
      top: `${placed.y}px`,
      width: `${placed.width}px`,
      height: `${placed.height}px`,
    });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
    fireEvent.pointerCancel(box);
    fireEvent.pointerUp(box, { clientX: 80, clientY: 40 });
    expect(box).toHaveStyle({ left: `${placed.x}px`, top: `${placed.y}px` });
  });

  it('빈 글자칸은 저장하지 않고, 확인으로 넘어가지 않는다', async () => {
    const update = vi.fn();
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'ghost',
              pageNumber: 1,
              posX: 0,
              posY: 0,
              width: 10,
              height: 5,
              type: 'TEXT',
              textContent: '   ',
              paramKey: null,
            },
          ],
        }),
      ),
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '저장하기' }));
    expect(update).not.toHaveBeenCalled();
    expect(
      screen.getByText('이 글자칸은 비어 있어 저장할 수 없습니다. 문구를 적거나, 보낼 때 채우는 이름을 붙이세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '그래도 저장' })).not.toBeInTheDocument();
  });

  it('아직 안 쓴 이름은 확인 뒤에만 저장한다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'rent',
              pageNumber: 1,
              posX: 0,
              posY: 0,
              width: 10,
              height: 5,
              type: 'TEXT',
              textContent: '',
              paramKey: 'new_rent',
            },
          ],
        }),
      ),
      listParamKeys: vi.fn().mockResolvedValue({
        keys: [{ key: 'tenant_name', label: '임차인', useCount: 2 }],
      }),
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '저장하기' }));
    expect(await screen.findByRole('button', { name: '그래도 저장' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '이 회사에서 아직 쓴 적이 없는 이름입니다. 값을 보내는 쪽과 글자가 다르면 계약서가 만들어지지 않습니다. 그래도 저장할까요?',
      ),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '그래도 저장' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
  });

  it('확인한 뒤에 이름을 바꾸면 그 확인으로는 저장되지 않는다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'rent',
              pageNumber: 1,
              posX: 0,
              posY: 0,
              width: 10,
              height: 5,
              type: 'TEXT',
              textContent: '',
              paramKey: 'new_rent',
            },
          ],
        }),
      ),
      listParamKeys: vi.fn().mockResolvedValue({
        keys: [{ key: 'tenant_name', label: '임차인', useCount: 2 }],
      }),
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '글자칸' }));
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    expect(await screen.findByText('new_rent')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /고급 · 외부 연동/ }));
    fireEvent.change(screen.getByLabelText('연동 이름표'), { target: { value: 'other_name' } });
    fireEvent.click(screen.getByRole('button', { name: '그래도 저장' }));
    expect(await screen.findByText('other_name')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '그래도 저장' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const body = update.mock.calls[0]?.[1] as { fields: Array<{ paramKey?: string | null }> };
    expect(body.fields[0]?.paramKey).toBe('other_name');
  });

  it('이름 목록을 가져오지 못하면 저장하지 않는다', async () => {
    const update = vi.fn();
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'rent',
              pageNumber: 1,
              posX: 0,
              posY: 0,
              width: 10,
              height: 5,
              type: 'TEXT',
              textContent: '임차인',
              paramKey: 'tenant_name',
            },
          ],
        }),
      ),
      listParamKeys: vi.fn().mockRejectedValue(new Error('down')),
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '저장하기' }));
    expect(await screen.findByText('이름 목록을 가져오지 못해 저장하지 않았습니다')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '그래도 저장' })).not.toBeInTheDocument();
  });

  it('파트너가 준 이름 목록이 있으면 서버 목록을 묻지 않는다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const listParamKeys = vi.fn();
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'who',
              pageNumber: 1,
              posX: 0,
              posY: 0,
              width: 10,
              height: 5,
              type: 'TEXT',
              paramKey: 'senderName',
            },
          ],
        }),
      ),
      listParamKeys,
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} expectedParamKeys={['sender_name']} />);
    fireEvent.click(await screen.findByRole('button', { name: '저장하기' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(listParamKeys).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '그래도 저장' })).not.toBeInTheDocument();
  });

  it('기본 제공 양식은 저장이 없고, 복사한 번호를 이어서 연다', async () => {
    const getTemplate = vi.fn(async (id: string) => {
      if (id === 'copy-1') return detail({ id: 'copy-1', title: '사본', source: 'COMPANY' });
      return detail({ id: 'sys-1', title: '기본 계약서', source: 'SYSTEM' });
    });
    const cloneTemplate = vi.fn().mockResolvedValue({ id: 'copy-1', title: '사본' });
    const paper = client({ getTemplate, cloneTemplate });
    render(<TemplateEditor client={paper} templateId="sys-1" pages={pages} />);
    expect(
      await screen.findByText('기본으로 들어 있는 양식은 고칠 수 없습니다. 우리 양식으로 복사한 뒤 고치세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장하기' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '우리 양식으로 복사한 뒤 고치기' }));
    expect(await screen.findByRole('button', { name: '저장하기' })).toBeInTheDocument();
    expect(cloneTemplate).toHaveBeenCalledWith('sys-1');
    expect(getTemplate).toHaveBeenCalledWith('copy-1');
  });

  it('미리보기에는 저장과 복사가 없다', async () => {
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            { id: 'sign', pageNumber: 1, posX: 10, posY: 20, width: 30, height: 10, type: 'SIGNATURE' },
          ],
        }),
      ),
    });
    render(<TemplatePreview client={paper} templateId="t1" pages={pages} />);
    expect(await screen.findByText('임대차')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장하기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '우리 양식으로 복사한 뒤 고치기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '서명칸 놓기' })).not.toBeInTheDocument();
  });

  it('기본 제공이라고 거절되면 한 번만 보내고 복사 안내로 바뀐다', async () => {
    const update = vi.fn().mockRejectedValue(
      new PaperApiError(403, 'system_template_readonly', '기본 제공 양식은 고칠 수 없습니다.', '/api/templates/t1'),
    );
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [{ id: 'sign', pageNumber: 1, posX: 1, posY: 1, width: 10, height: 5, type: 'SIGNATURE' }],
        }),
      ),
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '저장하기' }));
    expect(
      await screen.findByText('기본으로 들어 있는 양식은 고칠 수 없습니다. 우리 양식으로 복사한 뒤 고치세요.'),
    ).toBeInTheDocument();
    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '저장하기' })).not.toBeInTheDocument();
  });

  it('서명란과 글자칸을 올리면 저장 본문의 퍼센트가 같은 자로 재는 값이다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const paper = client({ updateTemplate: update });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '서명칸 놓기' }));
    fireEvent.click(screen.getByRole('button', { name: '글자칸 놓기' }));
    fireEvent.click(screen.getByRole('button', { name: '글자칸' }));
    fireEvent.change(screen.getByLabelText('글자칸 내용'), { target: { value: '월세' } });
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const body = update.mock.calls[0]?.[1] as { fields: Array<Record<string, unknown>>; signers?: unknown };
    expect(body).not.toHaveProperty('signers');
    expect(body).not.toHaveProperty('organizationId');
    expect(body.fields.find((field) => field.type === 'SIGNATURE')).toMatchObject(
      centeredPercent(500, 1000, SIGNATURE_BOX_PX),
    );
    expect(body.fields.find((field) => field.type === 'TEXT')).toMatchObject({
      ...centeredPercent(500, 1000, TEXT_BOX_PX),
      textContent: '월세',
    });
  });

  it('불러온 그림과 날짜 칸은 저장 본문에 남는다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'img',
              pageNumber: 1,
              posX: 1,
              posY: 2,
              width: 3,
              height: 4,
              type: 'IMAGE',
              imageFileKey: 'images/mark',
              imageMime: 'image/png',
              imageUrl: 'https://s3.example/mark',
            },
            {
              id: 'when',
              pageNumber: 1,
              posX: 5,
              posY: 6,
              width: 7,
              height: 8,
              type: 'TEXT',
              textContent: '2026-01-01',
              inputType: 'DATE',
              fontSize: 2,
            },
          ],
        }),
      ),
      updateTemplate: update,
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '저장하기' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const body = update.mock.calls[0]?.[1] as { fields: Array<Record<string, unknown>> };
    expect(body.fields[0]).toMatchObject({ imageFileKey: 'images/mark', imageMime: 'image/png' });
    expect(body.fields[0]).not.toHaveProperty('imageUrl');
    expect(body.fields[1]).toMatchObject({ inputType: 'DATE', fontSize: 2 });
    expect(body).not.toHaveProperty('signers');
  });

  it('끌어다 놓으면 그 자리에 칸이 생기고, 고른 사람의 색이 된다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const paper = client({ updateTemplate: update });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    await screen.findByRole('button', { name: '서명칸 놓기' });
    fireEvent.click(screen.getByRole('button', { name: /한 분 더/ }));
    fireEvent.click(screen.getByRole('button', { name: '2번 서명자 고르기' }));
    const pageEl = document.querySelector('.wg-paper-page');
    expect(pageEl).toBeTruthy();
    const store = new Map<string, string>([['application/x-field-type', 'SIGNATURE']]);
    const data = {
      dropEffect: 'copy',
      effectAllowed: 'copy',
      types: ['application/x-field-type'],
      getData(key: string) {
        return store.get(key) ?? '';
      },
    };
    const dropEvent = new MouseEvent('drop', { bubbles: true, clientX: 100, clientY: 80 });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: data });
    fireEvent(pageEl as Element, dropEvent);
    const box = await screen.findByRole('button', { name: '서명란' });
    expect(box).toHaveAttribute('data-signer', '2');
    expect(box).toHaveStyle({ left: '25px', top: '50px' });
    expect(box).toHaveTextContent('2번 서명자');
    fireEvent.change(screen.getByLabelText('2번 자리 이름'), { target: { value: '임차인' } });
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const body = update.mock.calls[0]?.[1] as {
      signers?: Array<{ slot: number; role: string }>;
      fields: Array<{ type?: string; signerSlot?: number }>;
    };
    expect(body.signers).toEqual([{ slot: 2, role: '임차인' }]);
    expect(body.fields.find((field) => field.type === 'SIGNATURE')?.signerSlot).toBe(2);
  });

  it('글자칸은 누가 채우는지 한 장으로 묻는다', async () => {
    const paper = client({
      getTemplate: vi.fn().mockResolvedValue(
        detail({
          fields: [
            {
              id: 'ghost',
              pageNumber: 1,
              posX: 0,
              posY: 0,
              width: 10,
              height: 5,
              type: 'TEXT',
              textContent: '',
              paramKey: null,
            },
          ],
        }),
      ),
    });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    fireEvent.click(await screen.findByRole('button', { name: '글자칸' }));
    expect(screen.getByRole('heading', { name: '이 칸은 누가 채우나' })).toBeInTheDocument();
    expect(screen.getByText(/지금은 아무도 채울 수 없는 칸입니다/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '보낼 때 채우게 하기' }));
    expect(screen.getByText(/보낼 때 채웁니다/)).toBeInTheDocument();
    expect(screen.getByText(/이름표를 적어 주십시오/)).toBeInTheDocument();
  });

  it('날짜칸은 글자칸의 넣는 방법으로 놓이고, 이름표가 있어야 저장된다', async () => {
    const update = vi.fn().mockResolvedValue({ id: 't1' });
    const paper = client({ updateTemplate: update, listParamKeys: vi.fn().mockResolvedValue({ keys: [] }) });
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} expectedParamKeys={['date_1']} />);
    fireEvent.click(await screen.findByRole('button', { name: '날짜칸 놓기' }));
    expect(screen.getByRole('heading', { name: '날짜칸' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '날짜칸' })).toHaveTextContent('날짜 · 보낼 때 고름');

    fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('날짜칸에 이름표를 적어 주십시오');
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('예: 시작일'), { target: { value: '시작일' } });
    expect(screen.getByText(/「시작일」을 달력으로 고르고/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const body = update.mock.calls[0]?.[1] as { fields: Array<Record<string, unknown>> };
    expect(body.fields).toHaveLength(1);
    expect(body.fields[0]).toMatchObject({
      type: 'TEXT',
      inputType: 'DATE',
      label: '시작일',
      paramKey: 'date_1',
    });
  });

  it('날짜칸도 끌어다 놓을 수 있다', async () => {
    const paper = client();
    render(<TemplateEditor client={paper} templateId="t1" pages={pages} />);
    await screen.findByRole('button', { name: '날짜칸 놓기' });
    const pageEl = document.querySelector('.wg-paper-page');
    const data = {
      dropEffect: 'copy',
      effectAllowed: 'copy',
      types: ['application/x-field-type'],
      getData: (key: string) => (key === 'application/x-field-type' ? 'DATE' : ''),
    };
    const dropEvent = new MouseEvent('drop', { bubbles: true, clientX: 100, clientY: 80 });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: data });
    fireEvent(pageEl as Element, dropEvent);
    const box = await screen.findByRole('button', { name: '날짜칸' });
    expect(box).toHaveAttribute('data-kind', 'text');
    expect(screen.getByText(/날짜 1개/)).toBeInTheDocument();
  });
});
