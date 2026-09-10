import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const MODEL = "google/gemini-3.8-flash";

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return badRequest("AI service is not configured.", 500);

        let body: { messages?: Msg[] };
        try {
          body = (await request.json()) as { messages?: Msg[] };
        } catch {
          return badRequest("Invalid request body.");
        }

        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return badRequest("No prompt was provided.");
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({ model: MODEL, messages, stream: true }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          let message = "The AI service could not complete this request.";
          if (upstream.status === 429)
            message = "Too many requests right now. Please wait a moment and try again.";
          if (upstream.status === 402)
            message = "AI credits are exhausted for this workspace. Please add credits to continue.";
          if (upstream.status === 403)
            message = "AI access is currently blocked for this workspace.";
          return new Response(JSON.stringify({ error: message, detail: detail.slice(0, 400) }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              buffer += decoder.decode(chunk, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (!data || data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed?.choices?.[0]?.delta?.content;
                  if (typeof text === "string" && text.length > 0) {
                    controller.enqueue(encoder.encode(text));
                  }
                } catch {
                  /* ignore partial frames */
                }
              }
            },
          }),
        );

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
