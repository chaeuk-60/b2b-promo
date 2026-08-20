// FE-1 완료 조건: 액세스 토큰 자동 첨부 + 401 시 리프레시 후 재시도.
// axios를 직접 모킹해서(실제 네트워크 없이) 등록된 인터셉터 함수 자체를 검증한다.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('axios', () => {
  const interceptors = {
    request: {
      handlers: [],
      use(fulfilled) {
        this.handlers.push({ fulfilled });
      },
    },
    response: {
      handlers: [],
      use(fulfilled, rejected) {
        this.handlers.push({ fulfilled, rejected });
      },
    },
  };

  function instance(config) {
    return Promise.resolve({ config, retried: true });
  }
  instance.interceptors = interceptors;

  const create = vi.fn(() => instance);
  const post = vi.fn();

  return { default: { create, post } };
});

describe('api client', () => {
  let axios;
  let client;
  let setAccessToken;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    axios = (await import('axios')).default;
    ({ default: client, setAccessToken } = await import('./client'));
    setAccessToken(null);
  });

  it('accessToken이 설정되어 있으면 요청에 Authorization 헤더를 자동으로 붙인다', () => {
    setAccessToken('test-token');
    const requestInterceptor = client.interceptors.request.handlers.at(-1).fulfilled;

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer test-token');
  });

  it('accessToken이 없으면 Authorization 헤더를 붙이지 않는다', () => {
    const requestInterceptor = client.interceptors.request.handlers.at(-1).fulfilled;

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('401 응답을 받으면 /auth/refresh로 새 액세스 토큰을 받아 원래 요청을 재시도한다', async () => {
    axios.post.mockResolvedValue({ data: { accessToken: 'new-token' } });
    const responseErrorInterceptor = client.interceptors.response.handlers.at(-1).rejected;
    const originalRequest = { headers: {} };

    const result = await responseErrorInterceptor({
      response: { status: 401 },
      config: originalRequest,
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      {},
      expect.objectContaining({ withCredentials: true })
    );
    expect(originalRequest.headers.Authorization).toBe('Bearer new-token');
    expect(result.retried).toBe(true);
  });

  it('401이 아닌 에러는 리프레시를 시도하지 않고 그대로 reject한다', async () => {
    const responseErrorInterceptor = client.interceptors.response.handlers.at(-1).rejected;

    await expect(
      responseErrorInterceptor({ response: { status: 500 }, config: { headers: {} } })
    ).rejects.toBeDefined();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
