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
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6',
      { headers: { Authorization: auth } }
    );
    if (!listRes.ok) {
      const errBody = await listRes.text();
      return NextResponse.json(
        { error: `Gagal memuat Gmail: ${errBody}` },
        { status: listRes.status }
      );
    }
    const listData = await listRes.json();
    const messages = listData.messages ?? [];

    const detailed = await Promise.all(
      messages.slice(0, 5).map(async (m: { id: string }) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: auth } }
        );
        if (!msgRes.ok) return null;
        const msg = await msgRes.json();
        const headers: Array<{ name: string; value: string }> =
          msg.payload?.headers ?? [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
            ?.value || '';
        return {
          id: msg.id,
          snippet: msg.snippet || '',
          subject: getHeader('Subject') || '(Tanpa Subjek)',
          from: getHeader('From'),
          date: getHeader('Date'),
        };
      })
    );

    return NextResponse.json({ messages: detailed.filter(Boolean) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengakses Gmail API.' },
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
    const { to, subject, body } = await req.json();
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Alamat tujuan, subjek, dan isi email wajib diisi.' },
        { status: 400 }
      );
    }

    const rawMime = [
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body,
    ].join('\r\n');

    const encodedMessage = Buffer.from(rawMime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    const data = await sendRes.json();
    if (!sendRes.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Gagal mengirim email melalui Gmail.' },
        { status: sendRes.status }
      );
    }

    return NextResponse.json({ id: data.id, status: 'sent' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengirim email.' },
      { status: 500 }
    );
  }
}
