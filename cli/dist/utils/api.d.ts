import { AxiosInstance } from 'axios';
/**
 * Create an Axios instance with auth token
 */
export declare function createApiClient(): AxiosInstance;
/**
 * Handle API errors with user-friendly messages
 */
export declare function handleApiError(error: any): never;
export interface ApiRequestOptions {
    method?: string;
    body?: any;
}
export declare function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>;
//# sourceMappingURL=api.d.ts.map