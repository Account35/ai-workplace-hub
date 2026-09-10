import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OutputPanel } from "@/components/OutputPanel";
import { useAiGeneration, type Msg } from "@/lib/ai-client";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      {
        name: "description",
        content:
          "Enter a topic, pasted text or an article link and get a structured summary, key insights and recommendations.",
      },
      { property: "og:title", content: "AI Research Assistant — Workplace AI" },
      {
        property: "og:description",
        content: "Summaries, insights and recommendations from a topic, text or article link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

const MODES = [
  { id: "topic", label: "Topic" },
  { id: "text", label: "Paste text" },
  { id: "url", label: "Article URL" },
] as const;

type Mode = (typeof MODES)[number]["id"];

const PLACEHOLDER: Record<Mode, string> = {
  topic: "e.g. Hybrid work policies for mid-size engineering teams",
  text: "Paste the report, notes or article text you want analysed…",
  url: "https://example.com/article",
};

function ResearchPage() {
  const [mode, setMode] = useState<Mode>("topic");
  const [input, setInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { output, setOutput, loading, error, run } = useAiGeneration();

  const generate = useCallback(() => {
    const value = input.trim();
    if (!value) {
      setFormError("Add a topic, some text or a link before running the analysis.");
      return;
    }
    if (mode === "url" && !/^https?:\/\/\S+\.\S+/.test(value)) {
      setFormError("That doesn't look like a valid link. Include http:// or https://.");
      return;
    }
    setFormError(null);

    const source =
      mode === "topic"
        ? `Research topic: ${value}`
        : mode === "text"
          ? `Source text to analyse:\n"""\n${value.slice(0, 12000)}\n"""`
          : `Article URL: ${value}\nYou cannot open links. Base the analysis on what the URL and its title suggest, and state clearly in the Summary that the page content was not retrieved.`;

    const messages: Msg[] = [
      {
        role: "system",
        content:
          "You are a workplace research analyst. Always answer in plain text using exactly these four sections in this order: 'SUMMARY', 'KEY INSIGHTS', 'RECOMMENDATIONS', 'OPEN QUESTIONS'. Summary is 3-5 sentences; the other sections are concise bullet lines starting with '- '. Be concrete and practical for a business audience. Never fabricate statistics, sources or quotes; if something is uncertain, say so.",
      },
      { role: "user", content: `${source}\n\nProduce the analysis now.` },
    ];
    void run(messages);
  }, [input, mode, run]);

  return (
    <AppShell
      title="AI Research Assistant"
      description="Summaries, insights and recommendations from a topic, text or link."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-panel"
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
        >
          <fieldset>
            <legend className="text-sm font-medium">Source</legend>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setFormError(null);
                  }}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    mode === m.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="input" className="text-sm font-medium">
              {mode === "url" ? "Article link" : mode === "text" ? "Your text" : "Topic"}
            </label>
            {mode === "url" ? (
              <input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER[mode]}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={mode === "text" ? 10 : 4}
                placeholder={PLACEHOLDER[mode]}
                className="mt-1.5 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {mode === "url" && (
            <p className="text-xs text-muted-foreground">
              Links are not opened by the assistant. For precise results, paste the article text
              instead.
            </p>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Analysing…" : "Run analysis"}
          </button>
        </form>

        <OutputPanel
          label="Analysis"
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          onRegenerate={generate}
          canRegenerate={input.trim().length > 0}
          emptyHint="Your summary, insights and recommendations will appear here."
        />
      </div>
    </AppShell>
  );
}
