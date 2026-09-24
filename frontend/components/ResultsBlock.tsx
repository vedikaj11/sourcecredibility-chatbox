'use client';

import VerdictBadge from '@/components/VerdictBadge';
import SourceCard from '@/components/SourceCard';
import type { FactCheckResult } from '@/lib/mockData';

interface ResultsBlockProps {
  result: FactCheckResult;
}

function ScoreBar({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  const barColor =
    safeScore >= 75
      ? 'bg-emerald-500'
      : safeScore >= 50
        ? 'bg-amber-400'
        : 'bg-red-600';

  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-400">
        {label}
      </p>

      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${safeScore}%` }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] font-semibold text-emerald-400">
          {safeScore}% Credibility
        </span>

        <span className="text-[11px] text-zinc-500">
          {100 - safeScore}% Lower credibility
        </span>
      </div>
    </div>
  );
}

export default function ResultsBlock({
  result,
}: ResultsBlockProps) {
  const sourceReasons = result.sourceReasons ?? [];
  const scoreBreakdown = result.scoreBreakdown ?? [];

  return (
    <div className="space-y-4">

      {/* SOURCE CREDIBILITY */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">

        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-4">
          Source Credibility
        </p>

        <VerdictBadge
          verdict={result.verdict}
          size="lg"
        />

        <blockquote className="mt-4 border-l-2 border-zinc-700 pl-3 text-sm italic text-zinc-500 break-all">
          "{result.claim}"
        </blockquote>

        <ScoreBar
          score={result.sourceCredibilityScore}
          label="Final Credibility Score"
        />

        {/* SCORE BREAKDOWN */}
        {scoreBreakdown.length > 0 && (
          <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">

            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-3">
              Score Breakdown
            </p>

            <div className="space-y-2">
              {scoreBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-zinc-400"
                >
                  <span className="text-emerald-500">
                    ✓
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800 text-xs font-semibold text-zinc-300">
              Final credibility score:{' '}
              {result.sourceCredibilityScore}%
            </div>

          </div>
        )}

        {/* REASONS */}
        {sourceReasons.length > 0 && (
          <div className="mt-5">

            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-3">
              Reasons
            </p>

            <div className="space-y-2">
              {sourceReasons.map((reason, index) => (
                <div
                  key={index}
                  className="text-xs leading-relaxed text-zinc-400"
                >
                  • {reason}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* FACT ANALYSIS */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">

        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-3">
          Fact Analysis
        </p>

        <p className="text-sm leading-relaxed text-zinc-400">
          {result.factAnalysis}
        </p>

      </div>

      {/* AI ANALYSIS */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">

        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-3">
          AI Analysis
        </p>

        <p className="text-sm leading-relaxed text-zinc-400">
          AI analysis is not available from the current source
          credibility check.
        </p>

      </div>

      {/* ANALYSIS SUMMARY */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">

        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-3">
          Analysis Summary
        </p>

        <p className="text-sm leading-relaxed text-zinc-400">
          {result.reasoning}
        </p>

      </div>

      {/* SOURCES */}
      <div>

        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-3">
          Sources Reviewed ({result.sources.length})
        </p>

        <div className="space-y-2">
          {result.sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
            />
          ))}
        </div>

      </div>

    </div>
  );
}