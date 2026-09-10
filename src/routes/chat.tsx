import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Check, Copy, RotateCcw, Send, Trash2, User, Bot } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { streamAi, type Msg } from "@/lib/ai-client";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chat — Workplace AI" },
      {
        name: "description",
        content:
          "Ask an AI assistant practical workplace questions about meetings, feedback, planning and communication.",
      },
      { property: "og:title", content: "AI Workplace Chat — Workplace AI" },
      {
        property: "og:description",
        content: "Practical answers to everyday workplace questions from an AI assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const SYSTEM: Msg = {
  role: "system",
  content:
    "You are a practical workplace productivity assistant for professionals. Answer work-related questions about communication, meetings, planning, prioritisation, feedback, documentation and career topics. Be concise and structured: a short direct answer first, then compact bullet steps when useful. Use plain text, no markdown symbols like ** or ##. Stay professional and neutral, never fabricate facts, and politely redirect clearly off-topic requests back to workplace matters.",
};

const SUGGESTIONS = [
  "Help me prepare an agenda for a 30-minute project kickoff.",
  "How do I give critical feedback to a peer without damaging the relationship?",
  "Summarise how to prioritise a backlog when everything is urgent.",
];

type ChatMsg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = useCallback(async (history: ChatMsg[]) => {
    setLoading(true);
    setError(null);
    setMessages([...history, { role: "assistant", content: "" }]);
    try {
      await streamAi([SYSTEM, ...history], (delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { role: "assistant", content: last.content + delta };
          }
          return next;
        });
      });
    } catch (e) {
      setError((e as Error).message);
      setMessages(history);
    } finally {
      setLoading(false);
    }
  }, []);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || loading) return;
    setInput("");
    void ask([...messages, { role: "user", content: value }]);
  };

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const idx = messages.lastIndexOf(lastUser);
    void ask(messages.slice(0, idx + 1));
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      setCopiedIndex(null);
    }
  };

  return (
    <AppShell
      title="AI Workplace Chat"
      description="Ask practical questions about your day-to-day work."
    >
      <div className="flex min-h-[70vh] flex-col rounded-lg border border-border bg-card shadow-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Conversation</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={loading || messages.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" /> Regenerate
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              disabled={loading || messages.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Clear
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {messages.length === 0 && !error && (
            <div className="mx-auto max-w-lg py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Ask anything work-related. Try one of these to start:
              </p>
              <div className="mt-4 grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end gap-2">
                <div className="max-w-[85%] rounded-lg bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {m.content}
                </div>
                <User className="mt-2 size-4 shrink-0 text-muted-foreground" />
              </div>
            ) : (
              <div key={i} className="flex gap-2.5">
                <Bot className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {m.content ? (
                    <>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {m.content}
                      </p>
                      <button
                        type="button"
                        onClick={() => copy(m.content, i)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {copiedIndex === i ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {copiedIndex === i ? "Copied" : "Copy"}
                      </button>
                    </>
                  ) : (
                    <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>
                  )}
                </div>
              </div>
            ),
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-border p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="Ask a workplace question…"
            className="min-h-11 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
