'use client';

import { useState } from 'react';
import { Link2, Loader2, ArrowRight } from 'lucide-react';
import type { FactCheckResult } from '@/lib/mockData';

type InputMode = 'text' | 'url';

interface FactCheckInputProps {
  onResult: (result: FactCheckResult) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

function detectMode(text: string): InputMode {
  if (/^https?:\/\//i.test(text.trim())) {
    return 'url';
  }

  return 'text';
}

export default function FactCheckInput({
  onResult,
  isLoading,
  setIsLoading,
}: FactCheckInputProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [error, setError] = useState('');

  function handleTextChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const value = e.target.value;

    setText(value);
    setError('');

    if (value.trim()) {
      setMode(detectMode(value));
    } else {
      setMode('text');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input = text.trim();

    if (!input) {
      setError('Please enter a claim or paste a news URL.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const body =
        mode === 'url'
          ? { url: input }
          : { text: input };

      const response = await fetch(
        'http://127.0.0.1:8000/source-credibility',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      const result: FactCheckResult = {
        scan_id: data.scan_id,

        verdict: data.label || 'Unknown',

        confidence: data.score ?? 0,

        claim: input,

        reasoning:
          'AI analysis is not available from the current source credibility check.',

        factAnalysis:
          'Fact analysis is not available from the current source credibility check.',

        sourceCredibilityScore: data.score ?? 0,

        factAnalysisScore: 0,

        aiAnalysisScore: 0,

        sourceReasons: data.reasons ?? [],

        scoreBreakdown: data.score_breakdown ?? [],

        sources: data.matches
          ? data.matches.map(
              (
                match: {
                  url: string;
                  title?: string;
                  source?: string;
                  score?: number;
                },
                index: number
              ) => ({
                id: `source-${index + 1}`,
                title:
                  match.title ||
                  match.source ||
                  'Matching news source',
                url: match.url,
                credibility:
                  (match.score ?? 0) >= 75
                    ? 'High'
                    : (match.score ?? 0) >= 50
                      ? 'Medium'
                      : 'Low',
              })
            )
          : [
              {
                id: 'source-1',
                title:
                  data.source ||
                  'Analyzed Source',
                url:
                  mode === 'url'
                    ? input
                    : '#',
                credibility:
                  (data.score ?? 0) >= 75
                    ? 'High'
                    : (data.score ?? 0) >= 50
                      ? 'Medium'
                      : 'Low',
              },
            ],
      };

      onResult(result);
    } catch (err) {
      console.error(
        'Source credibility request failed:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the TruthLens backend.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const modeLabel =
    mode === 'url'
      ? 'URL detected'
      : 'Text claim';

  const modeColor =
    mode === 'url'
      ? 'text-blue-400'
      : 'text-zinc-500 dark:text-zinc-600';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <div
        className="
          relative rounded-xl border-2
          border-zinc-200 dark:border-zinc-700
          bg-white dark:bg-zinc-900
          focus-within:border-red-500
          dark:focus-within:border-red-600
          transition-colors
        "
      >
        <textarea
          id="claim-input"
          value={text}
          onChange={handleTextChange}
          placeholder="Enter a claim to fact-check or paste a news URL…"
          rows={4}
          disabled={isLoading}
          className="
            w-full px-4 pt-4 pb-2
            text-sm text-zinc-800 dark:text-zinc-200
            placeholder-zinc-400 dark:placeholder-zinc-600
            bg-transparent resize-none outline-none
            leading-relaxed
            disabled:opacity-50
          "
        />

        <div className="flex items-center justify-between px-4 pb-3">
          <span className={`text-xs ${modeColor}`}>
            {modeLabel}
          </span>

          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="
              inline-flex items-center gap-2
              rounded-lg bg-red-600 px-4 py-2
              text-sm font-semibold text-white
              hover:bg-red-700
              disabled:opacity-40
              disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isLoading ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Checking…
              </>
            ) : (
              <>
                <ArrowRight size={15} />
                Verify
              </>
            )}
          </button>
        </div>
      </div>

      {mode === 'url' && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link2 size={13} />
          URL detected — checking the source credibility
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}