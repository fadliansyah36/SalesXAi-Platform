import { GoogleGenAI } from '@google/genai';

/**
 * Server-side only Gemini SDK client.
 * Never import this module from a 'use client' component.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function extractGeminiErrorMessage(err: unknown): {
  status: number;
  message: string;
} {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Kuota API Gemini tercapai atau model ini memerlukan API key berbayar. Silakan periksa panel Settings > Secrets untuk memilih API key dengan billing aktif.',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Akses API Gemini ditolak (403). Periksa GEMINI_API_KEY pada panel Settings > Secrets.',
    };
  }
  if (raw.includes('404') || raw.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: `Model Gemini yang diminta tidak ditemukan atau belum tersedia: ${raw}`,
    };
  }
  return {
    status: 500,
    message: raw || 'Terjadi kesalahan saat memanggil layanan Gemini AI.',
  };
}
