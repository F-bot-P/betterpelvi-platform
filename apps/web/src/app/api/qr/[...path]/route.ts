import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

async function proxy(req: NextRequest, path: string[]) {
  if (!BACKEND) {
    return NextResponse.json(
      { message: 'NEXT_PUBLIC_API_URL is missing' },
      { status: 500 },
    );
  }

  const url = `${BACKEND.replace(/\/$/, '')}/qr/${path.join('/')}`;

  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
    },
    body:
      req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
        ? await req.text()
        : undefined,
    cache: 'no-store',
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
