import { API_URL } from "@Constants/envs";
import ky, { HTTPError, type Options } from "ky";

export interface TDefaultResponse<T> {
  status: number;
  message?: string;
  data: T;
}

/** Error carrying the parsed server payload, so callers can branch on it. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const extractMessage = (body: unknown): string | null => {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (typeof message === "string") return message;
  }
  return null;
};

class HttpClient {
  requestConfig: typeof ky;

  constructor() {
    this.requestConfig = ky.create({
      prefix: API_URL,
      // `Content-Type` is intentionally not set here: ky sets it per request
      // (`application/json` for `json:`), and a global value would corrupt
      // FormData/multipart uploads by overriding the generated boundary.
      headers: {
        accept: "application/json",
      },
      credentials: "include",
      hooks: {
        beforeError: [
          // ky has already read and parsed the error body into `error.data`
          // by this point; `response.clone()` would throw because the body is
          // consumed, so read `error.data` instead of re-reading the response.
          ({ error }) => {
            if (!(error instanceof HTTPError)) return error;
            const body: unknown = error.data;
            return new ApiError(
              extractMessage(body) ?? error.message,
              error.response.status,
              body,
            );
          },
        ],
      },
    });
  }

  async get<T>(url: string, config?: Options): Promise<TDefaultResponse<T>> {
    return await this.requestConfig
      .get(url, config)
      .json<TDefaultResponse<T>>();
  }

  async post<TRes, TReq = unknown>(
    url: string,
    data?: TReq,
    config?: Options,
  ): Promise<TDefaultResponse<TRes>> {
    return await this.requestConfig
      .post(url, { ...config, json: data })
      .json<TDefaultResponse<TRes>>();
  }

  async put<TRes, TReq = unknown>(
    url: string,
    data?: TReq,
    config?: Options,
  ): Promise<TDefaultResponse<TRes>> {
    return await this.requestConfig
      .put(url, { ...config, json: data })
      .json<TDefaultResponse<TRes>>();
  }

  async delete<T>(url: string, config?: Options): Promise<TDefaultResponse<T>> {
    return await this.requestConfig
      .delete(url, config)
      .json<TDefaultResponse<T>>();
  }
}

const HTTP_REQUEST = new HttpClient();
export default HTTP_REQUEST;
