import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return NextResponse.json(
      { error: 'Token Google Workspace diperlukan.' },
      { status: 401 }
    );
  }

  try {
    const timeMin = new Date().toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=8&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: auth } }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Gagal memuat jadwal Google Calendar.' },
        { status: res.status }
      );
    }
    return NextResponse.json({ items: data.items ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengakses Calendar API.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return NextResponse.json(
      { error: 'Token Google Workspace diperlukan.' },
      { status: 401 }
    );
  }

  try {
    const { summary, description, location, startIso, endIso } =
      await req.json();
    if (!summary || !startIso || !endIso) {
      return NextResponse.json(
        { error: 'Judul, waktu mulai, dan waktu selesai wajib diisi.' },
        { status: 400 }
      );
    }

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          description,
          location,
          start: { dateTime: startIso, timeZone: 'Asia/Jakarta' },
          end: { dateTime: endIso, timeZone: 'Asia/Jakarta' },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Gagal membuat acara kalender.' },
        { status: res.status }
      );
    }
    return NextResponse.json({ event: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal membuat event kalender.' },
      { status: 500 }
    );
  }
}
