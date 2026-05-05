import {
  generatePayload,
  parseStream,
  getProviderConfig,
  getActiveProvider,
} from "../utils/generate";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  const provider = getActiveProvider();
  return new Response(JSON.stringify({ provider }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { messages, temperature } = body;

    if (!messages) {
      return new Response(
        JSON.stringify({ error: { message: "No input text." } }),
        { status: 400 }
      );
    }

    const active = getActiveProvider();
    if (!active) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NoApiKey",
            message: "No AI provider is configured.",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const provider = active.id;
    const cfg = getProviderConfig(provider);
    const { url, init } = generatePayload(provider, messages, temperature);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `${cfg.label} API error ${response.status}: ${errorBody || response.statusText}`
      );
    }

    return parseStream(provider, response);
  } catch (err: any) {
    console.error("Error processing request:", err);

    const isTimeout =
      err.name === "AbortError" || err.message?.includes("abort");

    return new Response(
      JSON.stringify({
        error: {
          code: isTimeout ? "Timeout" : err.name || "UnknownError",
          message: isTimeout
            ? "Request timed out. Please try again."
            : err.message || "An unknown error occurred",
        },
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
