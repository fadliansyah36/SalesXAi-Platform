'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

interface PortalAiCoachModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  contextSummary: string;
  quickPrompts: string[];
  initialPrompt?: string;
}

interface ChatItem {
  role: 'user' | 'model';
  text: string;
}

export function PortalAiCoachModal({
  open,
  onClose,
  title,
  subtitle,
  contextSummary,
  quickPrompts,
  initialPrompt,
}: PortalAiCoachModalProps) {
  const [input, setInput] = useState(initialPrompt || quickPrompts[0] || '');
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      role: 'model',
      text: `Halo! Saya ${title}. Silakan pilih topik analisis cepat di bawah atau ajukan pertanyaan sesuai data operasional Anda saat ini.`,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const nextHistory = [...messages, { role: 'user' as const, text: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-4-hydrogen',
          message: trimmed,
          history: messages.slice(-6),
          contextSummary,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text:
            data.text ||
            data.error ||
            'Maaf, sistem AI sedang sibuk. Silakan coba kembali.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Koneksi ke server AI SalesX-Ai gagal. Periksa koneksi internet Anda.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Quick Prompt Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              type="button"
              onClick={() => sendPrompt(qp)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#19394B] dark:border-[#348CB2]/40 px-2.5 py-1.5 text-[11px] font-semibold text-[#194F70] dark:text-[#87CEEB] hover:bg-[#E5F4F8] cursor-pointer text-left"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-[#348CB2]" />
              <span>{qp}</span>
            </button>
          ))}
        </div>

        {/* Conversation Feed */}
        <div className="max-h-[320px] overflow-y-auto space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'model' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#194F70] text-white mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#348CB2] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin text-[#348CB2]" />
              <span>Menyusun analisis berbasis data aktual...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan analisis atau strategi..."
            className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#348CB2] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </Modal>
  );
}
