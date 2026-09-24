'use client';

import { ExternalLink, FileText } from 'lucide-react';
import type { Source } from '@/lib/mockData';

interface SourceCardProps {
  source: Source;
}

export default function SourceCard({
  source,
}: SourceCardProps) {
  const credibilityClass =
    source.credibility === 'High'
      ? 'text-emerald-500'
      : source.credibility === 'Medium'
        ? 'text-amber-400'
        : 'text-red-500';

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">

      <div className="flex items-center gap-3">

        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <FileText
            size={13}
            className="text-zinc-500"
          />
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {source.title}
          </p>

          <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
            {source.url}
          </p>

          <p className={`text-[11px] font-semibold mt-1 ${credibilityClass}`}>
            {source.credibility} credibility
          </p>

        </div>

        {source.url && source.url !== '#' && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Open source"
          >
            <ExternalLink size={14} />
          </a>
        )}

      </div>

    </div>
  );
}