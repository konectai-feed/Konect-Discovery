import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  params.set('limit', limit);
  params.set('offset', offset);

  try {
    const apiRes = await fetch(`${API_URL}/search?${params.toString()}`);

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: 'Search service unavailable' },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search service unavailable' },
      { status: 503 }
    );
  }
}
