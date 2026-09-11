import { NextResponse } from "next/server";

export function jsonError(
  message: string,
  statusCode: number,
  errors?: unknown,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      message,
      statusCode,
      success: false,
      ...(errors !== undefined ? { errors } : {}),
    },
    { status: statusCode, headers }
  );
}

export function retryAfterSeconds(resetMs: number) {
  return String(Math.max(1, Math.ceil((resetMs - Date.now()) / 1000)));
}
