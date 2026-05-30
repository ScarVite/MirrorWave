# MirrorWave

Mirrors new tracks from a **Spotify** playlist into a **Tidal** and/or **YouTube
Music** playlist.

It polls the Spotify playlist on a schedule (via `node-schedule`), detects tracks
it hasn't seen before, and adds them to each enabled destination. Progress is
tracked **per destination**, so a track that succeeded on one service but failed
on another is only retried where needed.

Matching:
- **Tidal** matches by **ISRC** (precise).
- **YouTube** has no ISRC lookup, so it matches by a text search of
  "artist title" and adds the top video result (less precise).

> Spotify has no push notifications for playlist changes, so "listening" is done by
> polling. Adding tracks requires a user login, so there is a one-time interactive
> authorization step per service.

> **YouTube quota:** the YouTube Data API gives ~10,000 units/day; each mirrored
> track costs ~150 units (search + insert), so ~60 adds/day. A large initial
> backfill is spread across several days; `YOUTUBE_MAX_ADDS_PER_RUN` caps adds per
> pass and the syncer stops cleanly when the quota is hit, resuming next run.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create developer apps** (only for the destinations you enable in `SYNC_TARGETS`)
   - Spotify: <https://developer.spotify.com/dashboard> — add the redirect URI
     `http://127.0.0.1:8888/callback` to the app settings.
   - Tidal: <https://developer.tidal.com/dashboard> — add the redirect URI
     `http://127.0.0.1:8889/callback` and the scopes
     `playlists.read playlists.write user.read`.
   - YouTube: <https://console.cloud.google.com/apis/credentials> — create an
     OAuth client (type *Web application*), enable the **YouTube Data API v3**,
     and add the redirect URI `http://127.0.0.1:8890/callback`.

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Set `SYNC_TARGETS` (e.g. `tidal,youtube`), fill in the client ids/secrets,
   the Spotify source playlist id, and the destination playlist id(s).

4. **Authorize (one time)**

   ```bash
   npm run auth
   ```

   This prints a URL for each service; open it, approve access, and the tokens are
   saved to `.mirrorwave/tokens.json` (gitignored). Refresh tokens are reused
   automatically afterwards.

## Running

- **Scheduled watcher** (long-running, uses `node-schedule`):

  ```bash
  npm run build && npm start
  # or during development:
  npm run dev
  ```

- **One-shot pass** (e.g. for an external scheduler):

  ```bash
  npm run sync
  ```

## Configuration reference

| Variable | Default | Description |
| --- | --- | --- |
| `SYNC_TARGETS` | `tidal,youtube` | Comma-separated destinations to mirror to (`tidal`, `youtube`). |
| `SYNC_CRON` | `*/2 * * * *` | `node-schedule` cron expression for the poll interval. |
| `SYNC_EXISTING_ON_FIRST_RUN` | `true` | On a destination's first run, also copy tracks already in the Spotify playlist. Set `false` to only watch for new additions. |
| `RUN_ON_STARTUP` | `true` | Run one sync immediately when `npm start` launches. |
| `TIDAL_COUNTRY_CODE` | `US` | Country code used for Tidal catalogue lookups. |
| `YOUTUBE_MAX_ADDS_PER_RUN` | `50` | Max YouTube additions per pass (quota protection). |

Authorize a single service with e.g. `npm run auth -- youtube`.

## How matching works

- **Tidal:** each Spotify track exposes an **ISRC**; MirrorWave looks it up
  (`GET /tracks?filter[isrc]=...`) and adds the first match.
- **YouTube:** there is no ISRC lookup, so it searches for `"artists title"` and
  adds the top video result.

Tracks with no match (or no usable ISRC) are recorded as processed so they aren't
retried every pass.

## State files

Stored under `.mirrorwave/` (gitignored):

- `tokens.json` — Spotify/Tidal OAuth tokens.
- `state.json` — ids of Spotify tracks already mirrored.
