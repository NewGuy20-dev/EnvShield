import { NextResponse } from "next/server";

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

export function extractSetCookies(headers: Headers): string[] {
  const headerWithHelper = headers as HeadersWithGetSetCookie;
  if (typeof headerWithHelper.getSetCookie === "function") {
    return headerWithHelper.getSetCookie();
  }

  const header = headers.get("set-cookie");
  if (!header) {
    return [];
  }

  return [header];
}

export function appendSetCookies(response: NextResponse, cookies: string[]) {
  cookies.forEach((cookie) => {
    response.headers.append("Set-Cookie", cookie);
  });
}
