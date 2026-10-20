export type ApiLanguage = "rw" | "en" | "fr";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResult<TUser = Record<string, unknown>> {
  user: TUser;
  tokens: AuthTokens;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, data: unknown) {
    super(getErrorMessage(data, status));
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

let currentLanguage: ApiLanguage = "en";
let accessToken: string | undefined;
let refreshToken: string | undefined;

export function setApiLanguage(language: ApiLanguage): void {
  currentLanguage = language;
}

export function setAuthTokens(tokens: AuthTokens | null): void {
  accessToken = tokens?.access;
  refreshToken = tokens?.refresh;
}

export function clearAuthTokens(): void {
  setAuthTokens(null);
}

function getErrorMessage(data: unknown, status: number): string {
  const messages = collectErrorMessages(data);
  if (messages.length) return messages.join(" ");
  return `Request failed with status ${status}.`;
}

function collectErrorMessages(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([field, detail]) => {
    const messages = collectErrorMessages(detail);
    return field === "detail"
      ? messages
      : messages.map((message) => `${field}: ${message}`);
  });
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": currentLanguage,
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const data = (await readResponse(response)) as
    | { access?: string; refresh?: string }
    | undefined;
  if (!response.ok || !data?.access) {
    clearAuthTokens();
    return false;
  }
  accessToken = data.access;
  if (data.refresh) refreshToken = data.refresh;
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const send = () => {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    headers.set("Accept-Language", currentLanguage);
    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      ...options,
      headers,
    });
  };

  let response = await send();
  if (response.status === 401 && refreshToken && (await refreshAccessToken())) {
    response = await send();
  }
  const data = await readResponse(response);
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}

export async function apiLogin<TUser = Record<string, unknown>>(
  email: string,
  password: string,
  role?: string,
): Promise<AuthResult<TUser>> {
  const result = await apiRequest<AuthResult<TUser>>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password, ...(role ? { role } : {}) }),
  });
  setAuthTokens(result.tokens);
  return result;
}

export async function apiRegister<TUser = Record<string, unknown>>(
  account: Record<string, unknown>,
): Promise<AuthResult<TUser>> {
  const result = await apiRequest<AuthResult<TUser>>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(account),
  });
  setAuthTokens(result.tokens);
  return result;
}

export interface SupportedLanguagesResponse {
  default: ApiLanguage;
  current: ApiLanguage;
  languages: {
    code: ApiLanguage;
    name: string;
    native_name: string;
  }[];
}

export function getSupportedLanguages(): Promise<SupportedLanguagesResponse> {
  return apiRequest("/languages/");
}

export function updatePreferredLanguage(
  language: ApiLanguage,
): Promise<Record<string, unknown>> {
  return apiRequest("/profile/", {
    method: "PATCH",
    body: JSON.stringify({ preferred_language: language }),
  });
}
