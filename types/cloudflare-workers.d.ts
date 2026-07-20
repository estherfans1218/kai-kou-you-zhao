declare module "cloudflare:workers" {
  export const env: any;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

type D1Database = any;

interface R2Bucket {
  put(key: string, value: ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
  get(key: string): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(key: string): Promise<void>;
}
