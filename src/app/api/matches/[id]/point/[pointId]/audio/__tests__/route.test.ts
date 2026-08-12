/**
 * @jest-environment jsdom
 */
const mockPointLog = {
  findFirst: jest.fn(),
  update: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: { pointLog: mockPointLog },
}));

jest.mock('@/lib/auth', () => ({
  withRLSHandler: jest.fn(async (_req: any, _role: string, handler: Function) => {
    try {
      return await handler();
    } catch (e) {
      console.error('[withRLSHandler mock] error:', e);
      throw e;
    }
  }),
  getRLSUser: jest.fn().mockReturnValue({ id: 'user1', role: 'ATHLETE' }),
}));

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('@/lib/api-helpers', () => ({
  handleApiError: jest.fn((_err: any) => {
    const status = 500;
    return {
      status,
      json: () => Promise.resolve({ error: 'INTERNAL_ERROR', detail: String(_err) }),
      headers: { get: () => 'application/json' },
    };
  }),
}));

jest.mock('next/server', () => {
  function MockNextResponse(body: any, init?: any) {
    const status = init?.status ?? 200;
    const headers = init?.headers ?? {};
    let parsed: any;
    const res = {
      status,
      headers: { get: (k: string) => headers[k] ?? null },
      json: jest.fn().mockImplementation(() => Promise.resolve(parsed)),
    };
    try { parsed = typeof body === 'string' ? JSON.parse(body) : body; } catch { parsed = body; }
    return res;
  }
  MockNextResponse.json = (data: any, init?: any) => MockNextResponse(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  return { NextResponse: MockNextResponse };
});

let POST: any, GET: any, DELETE: any;

beforeEach(async () => {
  jest.clearAllMocks();
  const mockArrayBuffer = async function (this: any) {
    return this._buffer ?? new ArrayBuffer(0);
  };
  if (!(File.prototype as any)._patched) {
    const origFile = File;
    const OrigFileProto = File.prototype;
    if (!OrigFileProto.arrayBuffer) {
      (OrigFileProto as any).arrayBuffer = mockArrayBuffer;
    }
    (OrigFileProto as any)._patched = true;
  }
  const mod = await import('../route');
  POST = mod.POST;
  GET = mod.GET;
  DELETE = mod.DELETE;
});

function makeFormData(file: File, durationMs: string): FormData {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('durationMs', durationMs);
  return fd;
}

function makeReq(method: string, formData?: FormData) {
  const req: any = {
    method,
    headers: new Map([['content-type', formData ? 'multipart/form-data' : 'application/json']]),
  };
  if (formData) {
    req.formData = jest.fn().mockResolvedValue(formData);
  }
  return req;
}

const defaultParams = { params: Promise.resolve({ id: 'match1', pointId: 'point1' }) };

describe('POST /api/matches/[id]/point/[pointId]/audio', () => {
  beforeEach(() => {
    mockPointLog.findFirst.mockResolvedValue({ id: 'point1' });
    mockPointLog.update.mockResolvedValue({});
  });

  it('uploads audio successfully', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'audio.webm', { type: 'audio/webm' });
    const fd = makeFormData(file, '5000');
    const res = await POST(makeReq('POST', fd), defaultParams);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.mime).toBe('audio/webm');
    expect(body.durationMs).toBe(5000);
    expect(mockPointLog.update).toHaveBeenCalledWith({
      where: { id: 'point1' },
      data: expect.objectContaining({
        audioNoteMime: 'audio/webm',
        audioNoteDuration: 5000,
      }),
    });
  });

  it('rejects invalid mime type', async () => {
    const file = new File([new Uint8Array([1])], 'audio.wav', { type: 'audio/wav' });
    const fd = makeFormData(file, '5000');
    const res = await POST(makeReq('POST', fd), defaultParams);
    const body = await res.json();

    expect(body.error).toBe('INVALID_MIME');
  });

  it('rejects oversized file', async () => {
    const largeBuffer = new Uint8Array(600 * 1024);
    const file = new File([largeBuffer], 'audio.webm', { type: 'audio/webm' });
    const fd = makeFormData(file, '5000');
    const res = await POST(makeReq('POST', fd), defaultParams);
    const body = await res.json();

    expect(body.error).toBe('FILE_TOO_LARGE');
  });

  it('returns 404 when point not found', async () => {
    mockPointLog.findFirst.mockResolvedValue(null);
    const file = new File([new Uint8Array([1])], 'audio.webm', { type: 'audio/webm' });
    const fd = makeFormData(file, '5000');
    const res = await POST(makeReq('POST', fd), { params: Promise.resolve({ id: 'match1', pointId: 'nonexistent' }) });
    const body = await res.json();

    expect(body.error).toBe('NOT_FOUND');
  });
});

describe('GET /api/matches/[id]/point/[pointId]/audio', () => {
  it('returns audio blob', async () => {
    mockPointLog.findFirst.mockResolvedValue({
      audioNote: Buffer.from([1, 2, 3]),
      audioNoteMime: 'audio/webm',
      audioNoteDuration: 5000,
    });

    const res = await GET(makeReq('GET'), defaultParams);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/webm');
    expect(res.headers.get('X-Audio-Duration-Ms')).toBe('5000');
  });

  it('returns 404 when no audio', async () => {
    mockPointLog.findFirst.mockResolvedValue({
      audioNote: null,
      audioNoteMime: null,
      audioNoteDuration: null,
    });

    const res = await GET(makeReq('GET'), defaultParams);
    const body = await res.json();

    expect(body.error).toBe('NOT_FOUND');
  });
});

describe('DELETE /api/matches/[id]/point/[pointId]/audio', () => {
  it('deletes audio successfully', async () => {
    mockPointLog.findFirst.mockResolvedValue({ audioNote: Buffer.from([1, 2, 3]) });
    mockPointLog.update.mockResolvedValue({});

    const res = await DELETE(makeReq('DELETE'), defaultParams);

    expect(res.status).toBe(204);
    expect(mockPointLog.update).toHaveBeenCalledWith({
      where: { id: 'point1' },
      data: { audioNote: null, audioNoteMime: null, audioNoteDuration: null },
    });
  });

  it('returns 404 when no audio to delete', async () => {
    mockPointLog.findFirst.mockResolvedValue({ audioNote: null });

    const res = await DELETE(makeReq('DELETE'), defaultParams);
    const body = await res.json();

    expect(body.error).toBe('NOT_FOUND');
  });
});
