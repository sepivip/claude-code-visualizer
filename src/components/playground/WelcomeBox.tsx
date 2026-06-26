// src/components/playground/WelcomeBox.tsx
import { BoxFrame } from '../common/BoxFrame';

export function WelcomeBox(): JSX.Element {
  return (
    <div data-testid="welcome">
      <BoxFrame title="✻ Welcome to the Claude Code Trainer">
        <div className="space-y-2 text-sm">
          <p className="text-neutral-200">
            Type /help to see commands, or click a tab above to explore.
          </p>
          <p className="text-neutral-400">
            Tip: this is a faux terminal — nothing here touches your real
            machine, so experiment freely.
          </p>
        </div>
      </BoxFrame>
    </div>
  );
}
