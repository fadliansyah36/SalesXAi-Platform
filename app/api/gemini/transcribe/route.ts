import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, extractGeminiErrorMessage } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const base64Audio: string = String(body.audioBase64 || '');
    const mimeType: string = String(body.mimeType || 'audio/webm');

    if (!base64Audio) {
      return NextResponse.json(
        { error: 'Data audio rekaman tidak ditemukan.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: 'Transkripsikan rekaman suara sales lapangan ini ke dalam teks Bahasa Indonesia yang jelas dan rapi.',
          },
        ],
      },
    });

    return NextResponse.json({
      transcript: (response.text ?? '').trim(),
      model: 'gemini-3.5-transcribe',
    });
  } catch (err) {
    const parsed = extractGeminiErrorMessage(err);
    return NextResponse.json(
      { error: parsed.message },
      { status: parsed.status }
    );
  }
}
