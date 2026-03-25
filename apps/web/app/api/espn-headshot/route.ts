import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, string | null>();

const findImageUrl = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    if (value.includes('espncdn.com') && /(headshots|photo|athlete|player)/i.test(value)) {
      return value;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findImageUrl(item);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const nested = findImageUrl(record[key]);
      if (nested) return nested;
    }
  }

  return null;
};

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim();
  if (!name) {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  if (cache.has(name)) {
    return NextResponse.json({ imageUrl: cache.get(name) ?? null });
  }

  try {
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=5`;
    const response = await fetch(url, {
      headers: {
        accept: 'application/json'
      },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) {
      cache.set(name, null);
      return NextResponse.json({ imageUrl: null });
    }

    const data = (await response.json()) as unknown;
    const imageUrl = findImageUrl(data);
    cache.set(name, imageUrl ?? null);

    return NextResponse.json({ imageUrl: imageUrl ?? null });
  } catch {
    cache.set(name, null);
    return NextResponse.json({ imageUrl: null });
  }
}
