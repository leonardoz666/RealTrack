/**
 * Cliente HTTP centralizado com Axios
 * 
 * Features:
 * - Configuração base unificada
 * - Interceptors de request (auth token)
 * - Interceptors de response (erro, retry, rate limit)
 * - Tipagem genérica para responses
 */

import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type RawAxiosResponseHeaders,
} from 'axios';

// ============================================
// Tipos
// ============================================

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: RawAxiosResponseHeaders;
}

export interface ApiErrorData {
  error?: string | { path?: string[]; message?: string }[];
  message?: string;
  retryAfter?: number;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
}

// ============================================
// Configuração
// ============================================

const DEFAULT_BASE_URL = 'http://localhost:3001/api';
const envBaseUrl = typeof import.meta.env.VITE_API_URL === 'string' 
  ? import.meta.env.VITE_API_URL 
  : undefined;

const BASE_URL = (envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : DEFAULT_BASE_URL).replace(/\/$/, '');
const DEFAULT_TIMEOUT = 15000; // 15 segundos (reduzido de 70s para melhor UX)

// ============================================
// Estado Global
// ============================================

// Referência ao token getter (será injetada pelo authService)
let getAccessToken: (() => string | null) | null = null;
let clearTokens: (() => void) | null = null;

// ============================================
// Utilitários
// ============================================

const toApiResponse = <T>(response: AxiosResponse<T>): ApiResponse<T> => ({
  data: response.data,
  status: response.status,
  headers: response.headers,
});

// ============================================
// Criação do Cliente
// ============================================

const createApiClient = (config: ApiClientConfig = {}): AxiosInstance => {
  const {
    baseURL = BASE_URL,
    timeout = DEFAULT_TIMEOUT,
  } = config;

  const instance = axios.create({
    baseURL,
    timeout,
    withCredentials: true, // Sempre incluir credentials para httpOnly cookies
  });

  // ========================================
  // Request Interceptor
  // ========================================
  instance.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
    // Adicionar token de autorização se disponível
    const token = getAccessToken?.();
    
    if (token && token !== 'httpOnly-cookie') {
      if (requestConfig.headers instanceof AxiosHeaders) {
        requestConfig.headers.set('Authorization', `Bearer ${token}`);
      } else {
        const headers = AxiosHeaders.from(requestConfig.headers);
        headers.set('Authorization', `Bearer ${token}`);
        requestConfig.headers = headers;
      }
    }

    return requestConfig;
  });

  // ========================================
  // Response Interceptor
  // ========================================
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError<ApiErrorData> | any) => {
      const axiosError = error as AxiosError<ApiErrorData>;
      const config = axiosError.config;
      const status = axiosError.response?.status;

      // Retry automático para erros 5xx (apenas uma vez)
      if (
        status !== undefined &&
        status >= 500 &&
        status < 600 &&
        config &&
        !config.__retryCount
      ) {
        config.__retryCount = 1;
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            instance.request(config)
              .then(resolve)
              .catch(reject);
          }, 1000); // Aguardar 1 segundo antes de retry
        });
      }

      // Tratar rate limiting (429)
      if (status === 429) {
        const data = axiosError.response?.data;
        const retryAfter = data?.retryAfter ?? 60;
        const message = data?.error ?? 'Muitas requisições. Aguarde alguns minutos.';
        
        console.warn(`Rate limit atingido. Aguarde ${retryAfter} segundos.`);
        
        if (typeof window !== 'undefined') {
          const sanitizedMessage = typeof message === 'string' 
            ? message.replace(/<[^>]*>/g, '') 
            : 'Muitas requisições';
          alert(`${sanitizedMessage}\n\nTente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`);
        }
      }

      // Tratar erro de autenticação (401)
      if (status === 401) {
        clearTokens?.();
        // Redirecionar para login se não estiver na página de login
        // EXCETO para páginas do Telegram WebApp que têm seu próprio fluxo de auth
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes(ROUTES.LOGIN) &&
            !window.location.pathname.includes('/telegram/')) {
          window.location.href = ROUTES.LOGIN;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// ============================================
// Instância Singleton
// ============================================

const apiClient = createApiClient();

// ============================================
// API Pública
// ============================================

/**
 * Configura funções de autenticação (chamado pelo authService)
 */
export const configureAuth = (
  tokenGetter: () => string | null,
  tokenClearer: () => void
): void => {
  getAccessToken = tokenGetter;
  clearTokens = tokenClearer;
};

/**
 * @deprecated Cache interno removido em favor do React Query. Esta função não tem efeito.
 */
export const invalidateCache = (url: string, method: string = 'GET'): void => {
  // No-op
};

/**
 * @deprecated Cache interno removido em favor do React Query. Esta função não tem efeito.
 */
export const invalidateCachePattern = (pattern: string): void => {
  // No-op
};

/**
 * @deprecated Cache interno removido em favor do React Query. Esta função não tem efeito.
 */
export const clearCache = (): void => {
  // No-op
};

/**
 * Requisição GET tipada
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<T>(url, config);
  return toApiResponse(response);
}

/**
 * Requisição POST tipada
 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<T>(url, data, config);
  return toApiResponse(response);
}

/**
 * Requisição PUT tipada
 */
export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<T>(url, data, config);
  return toApiResponse(response);
}

/**
 * Requisição PATCH tipada
 */
export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<T>(url, data, config);
  return toApiResponse(response);
}

/**
 * Requisição DELETE tipada
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<T>(url, config);
  return toApiResponse(response);
}

// Exporta instância para casos que precisam do axios raw
export { apiClient };

// Export default para compatibilidade com código existente
export default apiClient;
