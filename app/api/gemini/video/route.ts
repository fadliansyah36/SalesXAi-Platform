import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, extractGeminiErrorMessage } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = String(body.prompt || '').trim();
    const aspectRatio = body.aspectRatio === '9:16' ? '9:16' : '16:9';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Deskripsi video promosi tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.2-flash',
        input: `Modern clean commercial product showcase video for retail outlets: ${prompt}`,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio,
          duration: '8s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (!videoPart || (!videoPart.data && !videoPart.uri)) {
      return NextResponse.json(
        { error: 'Video belum berhasil dihasilkan oleh model.' },
        { status: 502 }
      );
    }

    const videoUrl = videoPart.data
      ? `data:${videoPart.mime_type || 'video/mp4'};base64,${videoPart.data}`
      : videoPart.uri;

    return NextResponse.json({
      videoUrl,
      aspectRatio,
      model: 'gemini-omni-1.2-flash',
    });
  } catch (err) {
    const parsed = extractGeminiErrorMessage(err);
    return NextResponse.json(
      { error: parsed.message },
      { status: parsed.status }
    );
  }
}
