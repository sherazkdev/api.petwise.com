import pipeline from "@/middlewares/pipline";
import { NextRequest,NextResponse } from "next/server";

export default async function middleware(request:NextRequest){
    const response = await pipeline(request);

    return response ?? NextResponse.next();
};

export const config = {
    matcher: ["/api/v1/:path*"],
};