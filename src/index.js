export { ItchClient } from "./client.js";
export { ItchError } from "./errors.js";
export { ITCH_BROWSE_PAGES } from "./routes.js";

import { ItchClient } from "./client.js";

export function createItchClient(options) {
  return new ItchClient(options);
}

export async function getGame(gameUrl, options) {
  return new ItchClient(options).getGame(gameUrl);
}
export async function getUploads(gameUrl, options) {
  return new ItchClient(options).getUploads(gameUrl);
}
export async function getDownloadUploads(gameUrl, options) {
  return new ItchClient(options).getDownloadUploads(gameUrl);
}
export async function getDownloadUrl(gameUrl, uploadId, options) {
  return new ItchClient(options).getDownloadUrl(gameUrl, uploadId);
}
export async function getComments(gameUrl, options) {
  return new ItchClient(options).getComments(gameUrl);
}
export async function getProfile(profile, options) {
  return new ItchClient(options).getProfile(profile);
}
export async function searchGames(query, options, clientOptions) {
  return new ItchClient(clientOptions).searchGames(query, options);
}
export async function getSuggestions(query, options) {
  return new ItchClient(options).getSuggestions(query);
}
export async function getBrowsePage(section, browseOptions, clientOptions) {
  return new ItchClient(clientOptions).getBrowsePage(section, browseOptions);
}
export async function getFeed(feed, options) {
  return new ItchClient(options).getFeed(feed);
}
