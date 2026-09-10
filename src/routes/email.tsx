import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OutputPanel } from "@/components/OutputPanel";
import { useAiGeneration, type Msg } from "@/lib/ai-client";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      {
        name: "description",
        content:
          "Generate complete workplace emails in a formal, friendly or persuasive tone, then edit and copy them.",
      },
      { property: "og:title", content: "Smart Email Generator — Workplace AI" },
      {
        property: "og:description",
        content: "Generate complete workplace emails in formal, friendly or persuasive tones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive"] as const;
const LENGTHS = ["Short", "Standard", "Detailed"] as const;

function EmailPage() {
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [points, setPoints] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("Standard");
  const [formError, setFormError] = useState<string | null>(null);
  const { output, setOutput, loading, error, run } = useAiGeneration();

  const generate = useCallback(() => {
    if (!purpose.trim()) {
      setFormError("Describe what the email should be about before generating.");
      return;
    }
    setFormError(null);
    const messages: Msg[] = [
      {
        role: "system",
        content:
          "You are a professional workplace communication assistant. Write complete, ready-to-send business emails. Always return: a 'Subject:' line, a greeting, well-structured body paragraphs, a clear call to action, and a professional sign-off with [Your Name]. Use plain text only, no markdown, no commentary about the email itself. Keep it accurate and never invent specific facts, figures or commitments that were not provided.",
      },
      {
        role: "user",
        content: [
          `Tone: ${tone}`,
          `Length: ${length} (Short = under 120 words, Standard = 120-200 words, Detailed = 200-320 words)`,
          `Recipient / audience: ${recipient.trim() || "unspecified colleague"}`,
          `Purpose of the email: ${purpose.trim()}`,
          `Key points to include: ${points.trim() || "none provided — infer sensible, generic professional content"}`,
          "Write the email now.",
        ].join("\n"),
      },
    ];
    void run(messages);
  }, [purpose, recipient, points, tone, length, run]);

  return (
    <AppShell
      title="Smart Email Generator"
      description="Describe the situation and get a complete, professional email."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-panel"
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
        >
          <div>
            <label htmlFor="purpose" className="text-sm font-medium">
              What is the email about?
            </label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={4}
              placeholder="e.g. Ask the design team to move Friday's review to Monday"
              className="mt-1.5 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="recipient" className="text-sm font-medium">
              Recipient <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. My manager, Sarah"
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="points" className="text-sm font-medium">
              Key points <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              rows={3}
              placeholder="One point per line"
              className="mt-1.5 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Tone</legend>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    tone === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Length</legend>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
              {LENGTHS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    length === l
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Writing email…" : "Generate email"}
          </button>
        </form>

        <OutputPanel
          label="Generated email"
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          onRegenerate={generate}
          canRegenerate={purpose.trim().length > 0}
          emptyHint="Your email will appear here. Fill in the details and select a tone to start."
        />
      </div>
    </AppShell>
  );
}
