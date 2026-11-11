import { z } from "zod";

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json({ data }, init);
}

export function serverNow(): string {
  return new Date().toISOString();
}

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function isNotFoundError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2025"
  );
}

function uniqueConstraintTargets(e: unknown): string[] {
  const meta = (e as { meta?: { target?: unknown } }).meta;
  const target = meta?.target;
  if (Array.isArray(target)) {
    return target.map((t) => String(t));
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
}

export function errorResponse(e: unknown): Response {
  if (e instanceof AppError) {
    return Response.json(
      { error: { code: e.code, message: e.message, details: e.details ?? {} } },
      { status: e.status }
    );
  }
  if (e instanceof z.ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Permintaan tidak valid",
          details: {
            issues: e.issues.map((i) => ({
              path: i.path.map(String).join("."),
              message: i.message,
            })),
          },
        },
      },
      { status: 422 }
    );
  }
  if (isUniqueConstraintError(e)) {
    const targets = uniqueConstraintTargets(e);
    const code = targets.includes("email") ? "EMAIL_TAKEN" : "CONFLICT";
    const message =
      code === "EMAIL_TAKEN" ? "Email sudah terdaftar" : "Data sudah ada, tidak bisa diduplikasi";
    return Response.json(
      { error: { code, message, details: {} } },
      { status: 409 }
    );
  }
  if (isNotFoundError(e)) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Sumber daya tidak ditemukan", details: {} } },
      { status: 404 }
    );
  }
  console.error("Unhandled error", e);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal", details: {} } },
    { status: 500 }
  );
}

export type RouteContext<P extends Record<string, string>> = {
  params: Promise<P>;
};

export function apiHandler<P extends Record<string, string>>(
  handler: (req: Request, ctx: RouteContext<P>) => Promise<Response>
) {
  return async (req: Request, ctx: RouteContext<P>): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

// Paginasi keyset untuk daftar yang diurutkan createdAt desc lalu id desc.
export type Cursor = { c: string; id: string };

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(encoded: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<Cursor>;
    if (typeof parsed.c !== "string" || typeof parsed.id !== "string") return null;
    if (Number.isNaN(new Date(parsed.c).getTime())) return null;
    return { c: parsed.c, id: parsed.id };
  } catch {
    return null;
  }
}

export function isPrismaErrorCode(e: unknown, code: string): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === code
  );
}

export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError(400, "BAD_REQUEST", "Body permintaan harus JSON valid");
  }
}

export function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(400, "BAD_REQUEST", "Body permintaan harus JSON valid");
  }
}
