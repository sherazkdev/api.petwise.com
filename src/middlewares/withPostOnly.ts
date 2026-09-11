import { jsonError } from "@/lib/json-error";
import { NextRequest } from "next/server";

const withPostOnly = async (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  const isJobStatus =
    request.method === "GET" && /^\/api\/v1\/scan\/jobs\/[^/]+$/.test(path);
  if (isJobStatus) {
    return null;
  }
  if (request.method !== "POST") {
    return jsonError("Error: Method not allowed. Only POST is accepted.", 405);
  }
  return null;
};

export default withPostOnly;
