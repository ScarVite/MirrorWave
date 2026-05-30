"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForRedirect = waitForRedirect;
const http = __importStar(require("http"));
const url_1 = require("url");
/**
 * Starts a temporary local HTTP server bound to the host/port of `redirectUri`
 * and resolves with the authorization `code` once the OAuth provider redirects
 * back. Only requests matching the redirect path are accepted.
 */
function waitForRedirect(redirectUri, expectedState, timeoutMs = 5 * 60 * 1000) {
    const url = new url_1.URL(redirectUri);
    const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            if (!req.url)
                return;
            const reqUrl = new url_1.URL(req.url, `${url.protocol}//${url.host}`);
            if (reqUrl.pathname !== url.pathname) {
                res.writeHead(404).end("Not found");
                return;
            }
            const error = reqUrl.searchParams.get("error");
            const code = reqUrl.searchParams.get("code");
            const state = reqUrl.searchParams.get("state") ?? undefined;
            const finish = (message) => {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding-top:3rem">` +
                    `<h2>${message}</h2><p>You can close this tab and return to the terminal.</p></body></html>`);
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
        let timer;
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
