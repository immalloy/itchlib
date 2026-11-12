# Changelog

## 1.0.1

- Stopped retrying POST and other write requests.

## 1.0.0

- Game info: `getGame`, `getUploads`, `getComments`, `getProfile`.
- Discovery: `searchGames`, `getSuggestions`, `getBrowsePage`, `getFeed`.
- Downloads: `getDownloadUploads`, `getDownloadUrl`.
- Authenticated API: profile, games, ownership, purchases, rewards, keys, collections, and latest-version helpers.
- Developer tools: reusable `ItchClient`, TypeScript types, request retries, and cancellation with `AbortSignal`.
