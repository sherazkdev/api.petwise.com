import { jsonError } from "@/lib/json-error";
import env from "@/lib/env";
import { NextRequest } from "next/server";

const withApiKey = async (request: NextRequest) => {
  const apikey = request.headers.get("x-api-key");
  if (!apikey) {
    return jsonError("Error: Unauthorized. API key is required.", 401);
  }
  if (apikey !== env.X_API_KEY) {
    return jsonError("Error: Unauthorized. Invalid API key.", 401);
  }
  return null;
};

export default withApiKey;
