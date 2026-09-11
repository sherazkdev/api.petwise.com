import { handleScan } from "@/lib/handle-scan";
import { VALIDATE_SCAN_PET } from "@/schema/scanPet";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return handleScan(request, VALIDATE_SCAN_PET, false);
}
