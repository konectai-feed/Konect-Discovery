import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  const apiRes = await fetch(
    `http://localhost:3000/search?q=${encodeURIComponent(q)}`
  );

  const data = await apiRes.json();
  return NextResponse.json(data);
}
