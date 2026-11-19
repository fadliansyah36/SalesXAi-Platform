import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, extractGeminiErrorMessage } from '@/lib/gemini-server';

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

const ALLOWED_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-4-neon',
  'gemini-4-carbon',
  'gemini-3.1-flash-lite',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = String(body.message || '').trim();
    const history: ChatTurn[] = Array.isArray(body.history) ? body.history : [];
    const requestedModel: string = String(body.model || 'gemini-4-hydrogen');
    const useMapsGrounding: boolean = Boolean(body.useMapsGrounding);
    const latLng = body.latLng as
      | { latitude: number; longitude: number }
      | undefined;
    const contextSummary: string = String(body.contextSummary || '');

    if (!message) {
      return NextResponse.json(
        { error: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const model = useMapsGrounding
      ? 'gemini-4-hydrogen'
      : ALLOWED_MODELS.has(requestedModel)
        ? requestedModel
        : 'gemini-4-hydrogen';

    const systemInstruction = [
      'Anda adalah Staff AI SalesX-Ai, asisten operasional penjualan dan distribusi cerdas untuk tim sales lapangan di Indonesia.',
      'Jawablah dengan ringkas, terstruktur, berbasis data konteks yang diberikan, dan gunakan Bahasa Indonesia yang profesional.',
      'Jangan mengarang angka harga, stok, atau metrik yang tidak ada dalam konteks; jika data tidak tersedia, nyatakan dengan jujur.',
      contextSummary ? `Konteks Sales Aktif Saat Ini:\n${contextSummary}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    if (useMapsGrounding) {
      // Maps Grounding via gemini-4-hydrogen with googleMaps tool (no responseMimeType / responseSchema)
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: message,
        config: {
          systemInstruction,
          tools: [{ googleMaps: {} }],
          ...(latLng
            ? {
                toolConfig: {
                  retrievalConfig: {
                    latLng: {
                      latitude: Number(latLng.latitude),
                      longitude: Number(latLng.longitude),
                    },
                  },
                },
              }
            : {}),
        },
      });

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const mapsLinks = chunks
        .map((chunk: any) => {
          if (chunk?.maps?.uri) {
            return {
              title: chunk.maps.title || 'Lihat di Google Maps',
              uri: chunk.maps.uri,
              snippets:
                chunk.maps.placeAnswerSources?.reviewSnippets?.map(
                  (s: any) => s?.reviewText || ''
                ) ?? [],
            };
          }
          return null;
        })
        .filter(Boolean);

      return NextResponse.json({
        text: response.text ?? '',
        model: 'gemini-4-hydrogen',
        mapsLinks,
      });
    }

    // Standard multi-turn chat using ai.chats.create
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history: history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
    });

    const response = await chat.sendMessage({ message });

    return NextResponse.json({
      text: response.text ?? '',
      model,
      mapsLinks: [],
    });
  } catch (err) {
    const parsed = extractGeminiErrorMessage(err);
    return NextResponse.json(
      { error: parsed.message },
      { status: parsed.status }
    );
  }
}
