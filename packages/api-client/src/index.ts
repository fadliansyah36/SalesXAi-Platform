import type { AuthContext, SessionDeviceRegistration } from "@salesx-ai/api-contracts";

export type ApiPlatform = "web" | "android" | "ios" | "unknown";
export type AuthFailureCode = "session_revoked" | "account_inactive" | "identity_unverified";

export interface ApiClientAuth {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
  getOrganizationId?(): string | null;
  onSessionInvalidated?(code: string): Promise<void> | void;
}

export interface SalesXApiClientOptions {
  baseUrl: string;
  platform: ApiPlatform;
  auth: ApiClientAuth;
  fetcher?: typeof fetch;
}

export class SalesXApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly correlationId?: string | null,
  ) {
    super(message);
    this.name = "SalesXApiError";
  }
}

/** One typed transport for Web and Expo; authorization remains enforced by FastAPI. */
export class SalesXApiClient {
  private readonly baseUrl: string;
  private readonly platform: ApiPlatform;
  private readonly auth: ApiClientAuth;
  private readonly fetcher: typeof fetch;

  constructor(options: SalesXApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.platform = options.platform;
    this.auth = options.auth;
    this.fetcher = options.fetcher ?? fetch;
    if (!this.baseUrl) throw new Error("FastAPI base URL is required.");
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!path.startsWith("/") || path.startsWith("//")) {
      throw new Error("API paths must be relative to the configured FastAPI origin.");
    }
    let token = await this.auth.getAccessToken();
    if (!token) throw new SalesXApiError("An authenticated session is required.", 401, "unauthenticated");

    const send = (accessToken: string) => {
      const headers = new Headers(init.headers);
      headers.set("Authorization", "Bearer " + accessToken);
      headers.set("X-Client-Platform", this.platform);
      const organizationId = this.auth.getOrganizationId?.();
      if (organizationId) headers.set("X-Organization-ID", organizationId);
      if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return this.fetcher(this.baseUrl + path, { ...init, headers, cache: "no-store" });
    };

    let response = await send(token);
    if (response.status === 401) {
      const initialBody = await response.clone().json().catch(() => ({}));
      const initialCode = initialBody?.error?.code ?? "unauthorized";
      if (["session_revoked", "account_inactive", "identity_unverified"].includes(initialCode)) {
        await this.auth.onSessionInvalidated?.(initialCode);
        return response;
      }
      try {
        const refreshed = await this.auth.refreshAccessToken();
        if (refreshed) {
          token = refreshed;
          response = await send(token);
        } else {
          await this.auth.onSessionInvalidated?.("refresh_token_missing");
        }
      } catch (cause) {
        const status = (cause as { status?: number })?.status;
        if (status === 400 || status === 401 || status === 403) {
          await this.auth.onSessionInvalidated?.("refresh_token_rejected");
        }
        throw cause;
      }
    }

    if (response.status === 401 || response.status === 403) {
      const body = await response.clone().json().catch(() => ({}));
      const code = body?.error?.code ?? "unauthorized";
      if (
        response.status === 401 ||
        (["session_revoked", "account_inactive", "identity_unverified"] as AuthFailureCode[]).includes(code)
      ) {
        await this.auth.onSessionInvalidated?.(code);
      }
    }
    return response;
  }

  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetch(path, init);
    if (response.status === 204) return undefined as T;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new SalesXApiError(
        body?.error?.message ?? "FastAPI request failed.",
        response.status,
        body?.error?.code,
        body?.error?.correlation_id ?? response.headers.get("X-Correlation-ID"),
      );
    }
    return body as T;
  }

  getAuthContext(): Promise<AuthContext> {
    return this.request<AuthContext>("/api/v1/auth/me");
  }

  registerCurrentSession(payload: SessionDeviceRegistration): Promise<void> {
    return this.request<void>("/api/v1/auth/sessions/current", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  signOut(scope: "local" | "global" | "others" = "local"): Promise<void> {
    return this.request<void>("/api/v1/auth/sign-out", {
      method: "POST",
      body: JSON.stringify({ scope }),
    });
  }
}
