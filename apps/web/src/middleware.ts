import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const boardsUrl = new URL("/boards", request.url);
    return NextResponse.redirect(boardsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
