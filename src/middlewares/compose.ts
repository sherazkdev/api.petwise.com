import { NextRequest, NextResponse } from "next/server";

export type Middleware = (
  req: NextRequest
) => Promise<NextResponse | null> | NextResponse | null;

export function compose(...middlewares: Middleware[]) {
  return async (req: NextRequest) => {
    for (const middleware of middlewares) {
      const response = await middleware(req);

      if (response) {
        return response;
      }
    }

    return null;
  };
}