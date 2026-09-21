import { jsonError } from "@/lib/json-error";
import { NextRequest } from "next/server";

const withPostOnly = async (request: NextRequest) => {
  if (request.method !== "POST") {
    return jsonError("Error: Method not allowed. Only POST is accepted.", 405);
  }
  return null;
};

export default withPostOnly;
