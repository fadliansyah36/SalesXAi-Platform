import type { NextRequest } from "next/server";
import { POST as backendPost } from "@/app/api/backend/[...path]/route";

/** Authenticated BFF bridge to FastAPI; the Places key never enters the portal runtime. */
export async function POST(request: NextRequest) {
  return backendPost(request, {
    params: Promise.resolve({ path: ["maps", "places", "search"] }),
  });
}
