import axios, { AxiosInstance } from 'axios';

/**
 * Merkezi HTTP istemcisi.
 * PRD §22: HTTPS, Rate Limiting -> interceptor'lar burada genişletilir.
 */
export const createHttpClient = (baseURL: string, timeoutMs = 10_000): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: 'application/json' },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // TODO: Merkezi hata loglama / Sentry entegrasyonu
      return Promise.reject(error);
    }
  );

  return client;
};
