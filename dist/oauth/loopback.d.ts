export interface RedirectResult {
    code: string;
    state?: string;
}
/**
 * Starts a temporary local HTTP server bound to the host/port of `redirectUri`
 * and resolves with the authorization `code` once the OAuth provider redirects
 * back. Only requests matching the redirect path are accepted.
 */
export declare function waitForRedirect(redirectUri: string, expectedState?: string, timeoutMs?: number): Promise<RedirectResult>;
