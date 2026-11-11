export type ItchFeedName = "new" | "featured" | "sales";
export type ItchErrorCode =
  | "ITCH_ERROR"
  | "ITCH_HTTP_ERROR"
  | "ITCH_INVALID_RESPONSE"
  | "ITCH_INVALID_URL"
  | "ITCH_ACCESS_ERROR"
  | "ITCH_AUTH_REQUIRED"
  | "ITCH_API_ERROR"
  | "ITCH_ABORTED"
  | "ITCH_NETWORK_ERROR";

export interface ItchLink {
  url: string;
  text: string;
  title?: string;
}

export interface ItchAuthor {
  url: string | null;
  text: string;
}

export interface ItchUpload {
  id: string | null;
  name: string;
  filename: string;
  size: number;
  version: string | null;
  /** itch.io's own upload labels; itchlib does not infer platform categories. */
  platforms: string[];
}

export interface ItchComment {
  id: string | null;
  userId: number | null;
  isReply: boolean;
  author: string | null;
  authorUrl: string | null;
  createdAt: string | null;
  text: string;
  html: string | null;
  url: string | null;
}

export interface ItchDetail {
  label: string;
  text: string;
  links: ItchLink[];
}

export interface ItchGame {
  id: number | null;
  slug: string | null;
  url: string;
  title: string;
  author: string | null;
  authorUrl: string | null;
  authors: ItchAuthor[];
  description: string;
  descriptionHtml: string | null;
  cover: string | null;
  images: string[];
  screenshots: string[];
  videos: string[];
  embeds: string[];
  links: ItchLink[];
  price: string | null;
  purchase: { url: string | null; label: string } | null;
  details: ItchDetail[];
  status: string | null;
  pagePlatforms: ItchLink[];
  genres: ItchLink[];
  tags: ItchLink[];
  madeWith: ItchLink[];
  languages: ItchLink[];
  inputs: ItchLink[];
  accessibility: ItchLink[];
  developmentLogs: ItchLink[];
  comments: ItchComment[];
  uploads: ItchUpload[];
}

export interface ItchGameCard {
  id: number | null;
  title: string;
  url: string;
  cover: string | null;
  description: string | null;
  author: string | null;
  genre: string | null;
  platforms: string | null;
}

export interface ItchProfile {
  id: number | null;
  username: string | null;
  displayName: string;
  url: string;
  avatar: string | null;
  bio: string;
  bioHtml: string | null;
  links: ItchLink[];
  games: ItchGameCard[];
}

export interface ItchBrowseOption {
  label: string;
  url: string | null;
  value: string | null;
  selected: boolean;
}

export interface ItchBrowseFilterGroup {
  id: string | null;
  label: string;
  options: ItchBrowseOption[];
}

export interface ItchCommunityCategory {
  title: string;
  url: string;
  description: string | null;
  topicCount: number | null;
  latestTopic: { title: string; url: string; author: string | null } | null;
}

export interface ItchSale {
  id: string | null;
  type: string | null;
  title: string;
  url: string;
  author: ItchAuthor | null;
  itemCount: number | null;
  endsAt: string | null;
  /** itch.io's own labels, returned without platform classification. */
  platforms: string[];
  covers: string[];
}

export interface ItchFilterPicker {
  id: string | null;
  selected: string | null;
  options: ItchBrowseOption[];
}

export interface ItchSearchFacet {
  label: string;
  values: Array<{ label: string; count: number | null; url: string | null }>;
}

export interface ItchBrowsePage {
  url: string;
  title: string;
  query: string | null;
  resultCount: number | null;
  games: ItchGameCard[];
  jams: Array<{ title: string; url: string; joinedCount: number | null }>;
  categories: ItchCommunityCategory[];
  tags: Array<{
    title: string;
    url: string;
    cover: string | null;
    count: string | null;
    description: string | null;
  }>;
  bundles: Array<ItchSale | ItchLink>;
  sales: ItchSale[];
  devlogs: Array<{ title: string; url: string }>;
  blogPosts: Array<{ title: string; url: string; summary: string | null }>;
  topics: Array<{ title: string; url: string }>;
  filters: ItchBrowseFilterGroup[];
  filterPickers: ItchFilterPicker[];
  facets: ItchSearchFacet[];
  sortOptions: Array<ItchLink & { selected: boolean }>;
  activeSort: string | null;
  relatedTags: ItchLink[];
  nextPageUrl: string | null;
}

export interface ItchSuggestion {
  id?: number | string;
  url?: string;
  name?: string;
  title?: string;
  cover?: string;
  [key: string]: unknown;
}

export interface ItchSuggestions {
  query: string;
  games: ItchSuggestion[];
  tags: ItchSuggestion[];
  jams: ItchSuggestion[];
  bundles: ItchSuggestion[];
  [key: string]: unknown;
}

export interface ItchFeedItem {
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  author: string | null;
}

export interface ItchFeed {
  feed: ItchFeedName | string;
  url: string;
  items: ItchFeedItem[];
}

export type FetchLike = (input: URL | string, init?: RequestInit) => Promise<Response>;

export interface ItchClientOptions {
  fetch?: FetchLike;
  timeout?: number;
  /** itch.io API key; retained as a convenient alias for accessToken. */
  apiKey?: string;
  /** API key or OAuth/JWT bearer token. */
  accessToken?: string;
  /** Alias for accessToken. */
  token?: string;
  headers?: Record<string, string>;
  userAgent?: string;
  maxRetryDelay?: number;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface BrowseOptions extends RequestOptions {
  query?: string;
  page?: number;
  params?: Record<string, string | number | boolean | Array<string | number | boolean> | null | undefined>;
}

export interface SearchOptions extends RequestOptions {
  page?: number;
  [parameter: string]: unknown;
}

export interface ApiRequestOptions extends RequestOptions {
  query?: Record<string, string | number | boolean | Array<string | number> | null | undefined>;
  method?: string;
  body?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

export class ItchError extends Error {
  constructor(
    message: string,
    options?: { status?: number; url?: string; code?: ItchErrorCode; cause?: unknown },
  );
  code: ItchErrorCode;
  status?: number;
  url?: string;
}

export class ItchClient {
  constructor(options?: ItchClientOptions);
  request(url: URL | string, options?: RequestInit & { timeout?: number }): Promise<Response>;
  getGame(url: string, options?: RequestOptions): Promise<ItchGame>;
  getUploads(url: string, options?: RequestOptions): Promise<ItchUpload[]>;
  getDownloadUploads(url: string, options?: RequestOptions): Promise<ItchUpload[]>;
  getDownloadUrl(url: string, uploadId: string | number, options?: RequestOptions): Promise<string>;
  getComments(url: string, options?: RequestOptions): Promise<ItchComment[]>;
  getProfile(usernameOrUrl: string, options?: RequestOptions): Promise<ItchProfile>;
  getBrowsePage(sectionOrUrl?: string, options?: BrowseOptions): Promise<ItchBrowsePage>;
  searchGames(query: string, options?: SearchOptions): Promise<ItchBrowsePage>;
  getSuggestions(query: string, options?: RequestOptions): Promise<ItchSuggestions>;
  getFeed(feed?: ItchFeedName | string, options?: RequestOptions): Promise<ItchFeed>;
  apiRequest<T extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<T>;
  getApiProfile(options?: RequestOptions): Promise<Record<string, unknown>>;
  getApiCredentials(options?: RequestOptions): Promise<Record<string, unknown>>;
  getDeveloperGames(options?: RequestOptions): Promise<Record<string, unknown>>;
  getApiUploads(gameId: string | number, options?: RequestOptions): Promise<Record<string, unknown>>;
  getApiDownloadUrl(uploadId: string | number, options?: RequestOptions): Promise<Record<string, unknown>>;
  getGameDownloadKey(
    gameId: string | number,
    options:
      | ({ downloadKey: string } & RequestOptions)
      | ({ userId: string | number } & RequestOptions)
      | ({ email: string } & RequestOptions),
  ): Promise<Record<string, unknown>>;
  getGamePurchases(
    gameId: string | number,
    options: ({ userId: string | number } & RequestOptions) | ({ email: string } & RequestOptions),
  ): Promise<Record<string, unknown>>;
  getClaimedRewards(
    gameId: string | number,
    options?: { page?: number } & RequestOptions,
  ): Promise<Record<string, unknown>>;
  getAllClaimedRewards(gameId: string | number, options?: RequestOptions): Promise<unknown[]>;
  checkGameOwnership(gameId: string | number, options?: RequestOptions): Promise<Record<string, unknown>>;
  getCollections(options?: { gameId?: string | number } & RequestOptions): Promise<Record<string, unknown>>;
  getCollection(collectionId: string | number, options?: RequestOptions): Promise<Record<string, unknown>>;
  getCollectionGames(
    collectionId: string | number,
    options?: { page?: number; perPage?: number } & RequestOptions,
  ): Promise<Record<string, unknown>>;
  getAllCollectionGames(
    collectionId: string | number,
    options?: { perPage?: number } & RequestOptions,
  ): Promise<unknown[]>;
  createCollection(
    collection: {
      title?: string;
      private?: boolean;
      description?: string;
      layout?: "grid" | "list";
      game_id?: string | number;
      blurb?: string;
    },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>>;
  updateCollection(
    collectionId: string | number,
    collection: {
      title?: string;
      private?: boolean;
      description?: string;
      layout?: "grid" | "list";
      on_profile?: boolean;
    },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>>;
  deleteCollection(collectionId: string | number, options?: RequestOptions): Promise<Record<string, unknown>>;
  addGameToCollection(
    collectionId: string | number,
    game: { gameId: string | number; blurb?: string },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>>;
  removeGameFromCollection(
    collectionId: string | number,
    gameId: string | number,
    options?: RequestOptions,
  ): Promise<Record<string, unknown>>;
  updateCollectionGame(
    collectionId: string | number,
    gameId: string | number,
    game: { blurb?: string },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>>;
  orderCollection(
    collectionId: string | number,
    order: { gameIds: Array<string | number>; removeGameIds?: Array<string | number> },
    options?: RequestOptions,
  ): Promise<Record<string, unknown>>;
  getLatestVersion(
    options:
      | ({ channelName: string; target: string; gameId?: never } & RequestOptions)
      | ({ channelName: string; gameId: string | number; target?: never } & RequestOptions),
  ): Promise<Record<string, unknown>>;
  getOwnedKeys(options?: {
    page?: number;
    perPage?: number;
    gameIds?: Array<string | number>;
    signal?: AbortSignal;
  }): Promise<Record<string, unknown>>;
  getAllOwnedKeys(options?: {
    perPage?: number;
    gameIds?: Array<string | number>;
    signal?: AbortSignal;
  }): Promise<unknown[]>;
}

export const ITCH_BROWSE_PAGES: Readonly<{
  games: string;
  store: string;
  freeGames: string;
  funGames: string;
  demos: string;
  onSale: string;
  topRated: string;
  topSellers: string;
  newestGames: string;
  newAndPopular: string;
  tools: string;
  assets: string;
  soundtracks: string;
  physicalGames: string;
  comics: string;
  books: string;
  jams: string;
  community: string;
  devlogs: string;
  tags: string;
  bundles: string;
  blog: string;
  developers: string;
  search: string;
}>;
export function createItchClient(options?: ItchClientOptions): ItchClient;
export function getGame(url: string, options?: ItchClientOptions): Promise<ItchGame>;
export function getUploads(url: string, options?: ItchClientOptions): Promise<ItchUpload[]>;
export function getDownloadUploads(url: string, options?: ItchClientOptions): Promise<ItchUpload[]>;
export function getDownloadUrl(
  url: string,
  uploadId: string | number,
  options?: ItchClientOptions,
): Promise<string>;
export function getComments(url: string, options?: ItchClientOptions): Promise<ItchComment[]>;
export function getProfile(usernameOrUrl: string, options?: ItchClientOptions): Promise<ItchProfile>;
export function searchGames(
  query: string,
  options?: SearchOptions,
  clientOptions?: ItchClientOptions,
): Promise<ItchBrowsePage>;
export function getSuggestions(query: string, options?: ItchClientOptions): Promise<ItchSuggestions>;
export function getBrowsePage(
  sectionOrUrl?: string,
  browseOptions?: BrowseOptions,
  clientOptions?: ItchClientOptions,
): Promise<ItchBrowsePage>;
export function getFeed(feed?: ItchFeedName | string, options?: ItchClientOptions): Promise<ItchFeed>;
