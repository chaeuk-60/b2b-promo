// axios 인스턴스 + 인터셉터: 액세스 토큰 자동 첨부, 401 시 리프레시 토큰(httpOnly 쿠키)으로
// 재발급 후 원래 요청을 재시도한다. (10-plan.md FE-1, 6-project-principle.md 6장)
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 액세스 토큰은 메모리에만 보관한다(auth.store.js가 로그인/로그아웃 시 setAccessToken을 호출).
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

const client = axios.create({
  baseURL,
  withCredentials: true, // 리프레시 토큰(httpOnly 쿠키) 전송
});

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 여러 요청이 동시에 401을 받아도 리프레시 호출은 한 번만 나가도록 진행 중인 프로미스를 공유한다.
let refreshPromise = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
            .then((res) => res.data.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
