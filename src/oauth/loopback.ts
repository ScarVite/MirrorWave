import * as http from "http";
import { URL } from "url";

export interface RedirectResult {
  code: string;
  state?: string;
}

/**
 * Starts a temporary local HTTP server bound to the host/port of `redirectUri`
 * and resolves with the authorization `code` once the OAuth provider redirects
 * back. Only requests matching the redirect path are accepted.
 */
export function waitForRedirect(
  redirectUri: string,
  expectedState?: string,
  timeoutMs = 5 * 60 * 1000,
): Promise<RedirectResult> {
  const url = new URL(redirectUri);
  const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);

  return new Promise<RedirectResult>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const reqUrl = new URL(req.url, `${url.protocol}//${url.host}`);

      if (reqUrl.pathname !== url.pathname) {
        res.writeHead(404).end("Not found");
        return;
      }

      const error = reqUrl.searchParams.get("error");
      const code = reqUrl.searchParams.get("code");
      const state = reqUrl.searchParams.get("state") ?? undefined;

      const finish = (message: string) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          `<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding-top:3rem">` +
            `<h2>${message}</h2><p>You can close this tab and return to the terminal.</p></body></html>`,
        );
      };

      if (error) {
        finish("Authorization failed.");
        cleanup();
        reject(new Error(`Authorization error: ${error}`));
        return;
      }
      if (expectedState && state !== expectedState) {
        finish("State mismatch.");
        cleanup();
        reject(new Error("OAuth state mismatch (possible CSRF)."));
        return;
      }
      if (!code) {
        finish("Missing authorization code.");
        cleanup();
        reject(new Error("No authorization code returned."));
        return;
      }

      finish("MirrorWave authorized.");
      cleanup();
      resolve({ code, state });
    });

    let timer: NodeJS.Timeout;
    function cleanup() {
      clearTimeout(timer);
      server.close();
    }

    server.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    timer = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for OAuth redirect."));
    }, timeoutMs);

    server.listen(port, url.hostname);
  });
}
