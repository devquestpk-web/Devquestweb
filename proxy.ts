import { NextRequest, NextResponse } from "next/server";

const canonicalHost = "www.devquestpk.com";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (host?.endsWith(".vercel.app")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = canonicalHost;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/application-status/:path*"],
};
