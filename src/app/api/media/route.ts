import { NextRequest, NextResponse } from "next/server";

const ngrokDomainPattern = /https?:\/\/[^/]*\.ngrok(?:-free)?\.(?:app|dev|io)/i;

function isAllowedTarget(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) {
    return false;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    return ngrokDomainPattern.test(url.toString());
  }

  try {
    const configuredBase = new URL(apiBase);
    return url.host === configuredBase.host;
  } catch {
    return ngrokDomainPattern.test(url.toString());
  }
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ success: false, error: "Missing url query parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid target url" }, { status: 400 });
  }

  if (!isAllowedTarget(targetUrl)) {
    return NextResponse.json({ success: false, error: "Target not allowed" }, { status: 403 });
  }

  const upstream = await fetch(targetUrl.toString(), {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, error: `Upstream image request failed with status ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=300",
    },
  });
}
