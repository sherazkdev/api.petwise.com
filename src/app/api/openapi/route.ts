import { openApiSpec } from "@/lib/openapi";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(openApiSpec);
}
