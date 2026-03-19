import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(_: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
