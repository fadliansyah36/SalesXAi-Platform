import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, extractGeminiErrorMessage } from '@/lib/gemini-server';

const ALLOWED_SIZES = new Set(['1K', '2K', '4K']);
const ALLOWED_RATIOS = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = String(body.prompt || '').trim();
    const imageSize: string = ALLOWED_SIZES.has(body.imageSize)
      ? body.imageSize
      : '1K';
    const aspectRatio: string = ALLOWED_RATIOS.has(body.aspectRatio)
      ? body.aspectRatio
      : '1:1';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Deskripsi konten gambar tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `Clean modern commercial retail promotional poster in Indonesian market style for SalesX-Ai: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    });

    let imageUrl: string | null = null;
    let caption = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        caption += part.text;
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Model tidak mengembalikan data gambar. Coba sesuaikan prompt Anda.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl,
      caption,
      model: 'gemini-3-pro-image-preview',
      imageSize,
      aspectRatio,
    });
  } catch (err) {
    const parsed = extractGeminiErrorMessage(err);
    return NextResponse.json(
      { error: parsed.message },
      { status: parsed.status }
    );
  }
}
