import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return NextResponse.json(
      { error: 'Token Google Workspace diperlukan.' },
      { status: 401 }
    );
  }

  try {
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Gagal membuat ruang Google Meet.' },
        { status: res.status }
      );
    }

    return NextResponse.json({ space: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengakses Meet API.' },
      { status: 500 }
    );
  }
}
