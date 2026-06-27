const REPO_URL = 'https://github.com/sepivip/claude-code-visualizer';

export function TitleBar(): JSX.Element {
  return (
    <header className="flex items-center gap-3 border-b border-neutral-800 px-3 py-2">
      <span className="flex shrink-0 gap-1.5" aria-hidden="true">
        <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
      </span>
      <h1 className="min-w-0 truncate text-sm font-medium text-neutral-200">
        {'✻'} Claude Code — Interactive Trainer
      </h1>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <a
          href={`${REPO_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="hidden font-mono text-xs text-neutral-500 transition-colors hover:text-[#D97757] sm:inline"
        >
          v{__APP_VERSION__}
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Source on GitHub"
          title="Source on GitHub"
          className="text-neutral-400 transition-colors hover:text-[#D97757]"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
