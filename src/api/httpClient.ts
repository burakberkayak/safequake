import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Rate Limiter Konfigürasyonu: Sunucu Limiti = 40 İsten/dk -> İstemci Güvenlik Limiti = 35 İstek/60sn
const MAX_REQUESTS_PER_MINUTE = 35;
const MIN_GAP_BETWEEN_REQUESTS_MS = 1500; // İki istek arasında minimum 1.5 saniye bekleme
const WINDOW_MS = 60_000;

const requestTimestamps: number[] = [];
let lastRequestTime = 0;

/**
 * IP Ban engellemek için rate limit koruyucusu.
 * Dakikada maks 35 istek sınırı koyar ve iki istek arasına en az 1.5 saniye mesafe koyar.
 */
const enforceRateLimit = async (): Promise<void> => {
  const now = Date.now();

  // 1. 60 saniyeden eski olan istek zaman damgalarını temizle
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - WINDOW_MS) {
    requestTimestamps.shift();
  }

  // 2. Dakikalık 35 istek sınırı aşıldıysa pencere açılana kadar bekle
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestInWindow = requestTimestamps[0]!;
    const waitTime = oldestInWindow + WINDOW_MS - now + 100;
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // 3. İki istek arasında en az 1.5 saniye mesafe olmasını sağla
  const timeSinceLast = Date.now() - lastRequestTime;
  if (timeSinceLast < MIN_GAP_BETWEEN_REQUESTS_MS) {
    const gapWait = MIN_GAP_BETWEEN_REQUESTS_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, gapWait));
  }

  const execTime = Date.now();
  lastRequestTime = execTime;
  requestTimestamps.push(execTime);
};

export const createHttpClient = (baseURL: string, timeoutMs = 10_000): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: 'application/json' },
  });

  // Request Interceptor: Rate Limiting & Throttling
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    await enforceRateLimit();
    return config;
  });

  // Response Interceptor: HTTP 429 Too Many Requests Backoff & Otomatik Tekrar
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      if (response?.status === 429 && config && !(config as any)._isRetry) {
        (config as any)._isRetry = true;
        // HTTP 429 alındığında 3 saniye bekle ve isteği otomatik tekrar et
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return client(config);
      }
      return Promise.reject(error);
    }
  );

  return client;
};
