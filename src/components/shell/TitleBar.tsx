export function TitleBar(): JSX.Element {
  return (
    <header className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
      </span>
      <h1 className="text-sm font-medium text-neutral-200">
        {'✻'} Claude Code — Interactive Trainer
      </h1>
    </header>
  );
}
