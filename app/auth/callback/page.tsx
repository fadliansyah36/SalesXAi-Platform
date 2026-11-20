'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSalesXAuth } from "@/components/providers/AppProviders";

const PORTAL_PREFIXES = ["/sales", "/distributor", "/principal", "/supervisor", "/admin"];

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return null;
  if (value === "/" || value === "/portal" || value.startsWith("/portal/")) return value;
  return PORTAL_PREFIXES.some((prefix) => value === prefix || value.startsWith(prefix + "/")) ? value : null;
}

function portalPrefix(value: string | null): string | null {
  return value ? PORTAL_PREFIXES.find((prefix) => value === prefix || value.startsWith(prefix + "/")) ?? null : null;
}

export default function AuthCallbackPage() {
  const auth = useSalesXAuth();
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState("Memverifikasi identitas melalui Supabase Auth…");

  useEffect(() => {
    if (started.current || auth.status === "loading") return;
    started.current = true;
    if (auth.status === "configuration_error") {
      setMessage(auth.error ?? "Konfigurasi autentikasi belum tersedia.");
      return;
    }
    void auth.completeAuthCallback().then((result) => {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get("organization_invite");
      const next = safeNextPath(params.get("next"));
      const prefix = portalPrefix(next);

      if (result === "recovery") {
        router.replace(prefix ? prefix + "/auth/reset-password" : "/auth/reset-password");
      } else if (result === "authenticated") {
        const invitePath = prefix ? prefix + "/auth/accept-invitation" : "/auth/accept-invitation";
        router.replace(invite
          ? invitePath + "?token=" + encodeURIComponent(invite)
          : next ?? "/portal");
      } else {
        setMessage("Tautan autentikasi tidak valid atau sudah digunakan. Silakan minta tautan baru.");
      }
    }).catch((cause) => setMessage(cause instanceof Error ? cause.message : "Verifikasi gagal. Silakan coba lagi."));
  }, [auth, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <section className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h1 className="text-xl font-bold">Verifikasi SalesX-Ai</h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{message}</p>
      </section>
    </main>
  );
}
