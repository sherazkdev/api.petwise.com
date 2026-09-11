import { handleScan } from "@/lib/handle-scan";
import { VALIDATE_SCAN_FOOD } from "@/schema/scanFood";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return handleScan(request, VALIDATE_SCAN_FOOD, true);
}
