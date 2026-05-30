import type { TidalConfig } from "../config";
import { createPkcePair, randomState } from "../oauth/pkce";
import { waitForRedirect } from "../oauth/loopback";
import { loadTokens, updateTokens } from "../store";
import { logger } from "../utils/logger";

const AUTHORIZE_URL = "https://login.tidal.com/authorize";
const TOKEN_URL = "https://auth.tidal.com/v1/oauth2/token";

interface TidalTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  user_id?: number | string;
}

/** Performs a token endpoint request, applying Basic auth when a secret is set. */
async function tokenRequest(
  tidal: TidalConfig,
  params: Record<string, string>,
): Promise<TidalTokenResponse> {
  const body = new URLSearchParams({
    client_id: tidal.clientId,
    ...params,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (tidal.clientSecret) {
    const basic = Buffer.from(
      `${tidal.clientId}:${tidal.clientSecret}`,
    ).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }

  const res = await fetch(TOKEN_URL, { method: "POST", headers, body });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Tidal token request failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as TidalTokenResponse;
}

/**
 * Runs the Tidal Authorization Code + PKCE flow and persists the tokens.
 */
export async function authorizeTidal(tidal: TidalConfig): Promise<void> {
  const { verifier, challenge } = createPkcePair();
  const state = randomState();

  const authUrl = new URL(AUTHORIZE_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", tidal.clientId);
  authUrl.searchParams.set("redirect_uri", tidal.redirectUri);
  authUrl.searchParams.set("scope", tidal.scopes.join(" "));
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("state", state);

  console.log("\n[Tidal] Open this URL in your browser to authorize:\n");
  console.log(`  ${authUrl.toString()}\n`);

  const { code } = await waitForRedirect(tidal.redirectUri, state);

  const token = await tokenRequest(tidal, {
    grant_type: "authorization_code",
    code,
    redirect_uri: tidal.redirectUri,
    code_verifier: verifier,
  });

  if (!token.refresh_token) {
    throw new Error("Tidal did not return a refresh token.");
  }

  await updateTokens({
    tidal: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    },
  });

  logger.info("Tidal authorized successfully");
  console.log("[Tidal] Authorized and tokens saved.\n");
}

/**
 * Returns a valid Tidal access token, refreshing it when needed.
 * Throws if Tidal has not been authorized yet.
 */
export async function getValidTidalAccessToken(tidal: TidalConfig): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens.tidal?.refreshToken) {
    throw new Error(
      "Tidal is not authorized yet. Run `npm run auth` (or `npm run auth -- tidal`).",
    );
  }

  const expiresSoon = tokens.tidal.expiresAt - Date.now() < 60_000;
  if (!expiresSoon && tokens.tidal.accessToken) {
    return tokens.tidal.accessToken;
  }

  logger.debug("Refreshing Tidal access token");
  const token = await tokenRequest(tidal, {
    grant_type: "refresh_token",
    refresh_token: tokens.tidal.refreshToken,
  });

  const updated = await updateTokens({
    tidal: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? tokens.tidal.refreshToken,
      expiresAt: Date.now() + token.expires_in * 1000,
    },
  });

  return updated.tidal!.accessToken;
}
