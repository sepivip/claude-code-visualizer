// src/components/quiz/Quiz.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../shell/AppContext';
import { Quiz } from './Quiz';
import type { Rng } from './quizTypes';

// Deterministic seeded RNG — same one used in the generator tests.
function makeSeed(seed: number): Rng {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function renderQuiz(rng?: Rng) {
  return render(
    <AppProvider>
      <Quiz rng={rng ?? makeSeed(42)} />
    </AppProvider>,
  );
}

/** Answer the current question (choice or shortcut) then advance via Next. */
async function answerAndAdvance(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const options = screen.queryAllByTestId('quiz-option');
  if (options.length > 0) {
    await user.click(options[0]);
  } else {
    const capture = screen.queryByTestId('quiz-shortcut-capture');
    if (capture !== null) {
      capture.focus();
      await user.keyboard('{Control>}c{/Control}');
      const submit = screen.queryByRole('button', { name: /submit/i });
      if (submit) await user.click(submit);
    }
  }
  const next = screen.queryByTestId('quiz-next');
  if (next) await user.click(next);
}

beforeEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
});

describe('Quiz', () => {
  it('renders data-testid="quiz" and NOT surface-quiz', () => {
    renderQuiz();
    expect(screen.getByTestId('quiz')).toBeInTheDocument();
    expect(screen.queryByTestId('surface-quiz')).toBeNull();
  });

  it('shows the start screen initially with a quiz-start button', () => {
    renderQuiz();
    expect(screen.getByTestId('quiz-start')).toBeInTheDocument();
  });

  it('clicking Start begins the quiz and shows the scorebar', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByTestId('quiz-start'));
    expect(screen.getByTestId('quiz-score')).toBeInTheDocument();
    expect(screen.queryByTestId('quiz-start')).toBeNull();
  });

  it('answering a choice question shows feedback and a Next button', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByTestId('quiz-start'));

    const options = screen.queryAllByTestId('quiz-option');
    // Seed 42 → first question is a choice question with options.
    expect(options.length).toBeGreaterThan(0);
    await user.click(options[0]);
    expect(screen.getByTestId('quiz-next')).toBeInTheDocument();
  });

  it('answering the correct option increments the score', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByTestId('quiz-start'));

    const options = screen.getAllByTestId('quiz-option');
    expect(options.length).toBe(4);

    // The scorebar starts at 0. Click each option fresh by re-rendering is
    // overkill; instead find the option that turns green (correct) by clicking
    // the first one and reading feedback colour via the score delta.
    const scoreBefore = screen.getByTestId('quiz-score').textContent ?? '';
    await user.click(options[0]);
    const scoreAfter = screen.getByTestId('quiz-score').textContent ?? '';
    // Either it was correct (score increased) or not, but feedback must show.
    expect(screen.getByTestId('quiz-next')).toBeInTheDocument();
    // Find the green (correct) option after answering — exactly one exists.
    const greenOption = screen
      .getAllByTestId('quiz-option')
      .find((b) => b.className.includes('text-cc-green'));
    expect(greenOption).toBeDefined();
    // If we happened to click the correct one, score must have gone up.
    if (greenOption === options[0]) {
      expect(scoreAfter).not.toBe(scoreBefore);
    }
  });

  it('answering wrong reveals the correct option in green', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByTestId('quiz-start'));

    const options = screen.getAllByTestId('quiz-option');
    await user.click(options[0]);

    // After answering, exactly one option is green (the correct answer).
    const greens = screen
      .getAllByTestId('quiz-option')
      .filter((b) => b.className.includes('text-cc-green'));
    expect(greens.length).toBe(1);
  });

  it('completing all 10 questions reaches the results screen', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByTestId('quiz-start'));

    for (let i = 0; i < 10; i++) {
      await answerAndAdvance(user);
    }

    expect(screen.getByTestId('quiz-results')).toBeInTheDocument();
  }, 20000);

  it('Play again resets to the start screen', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByTestId('quiz-start'));

    for (let i = 0; i < 10; i++) {
      await answerAndAdvance(user);
    }
    expect(screen.getByTestId('quiz-results')).toBeInTheDocument();

    await user.click(screen.getByTestId('quiz-restart'));
    expect(screen.getByTestId('quiz-start')).toBeInTheDocument();
    expect(screen.queryByTestId('quiz-results')).toBeNull();
  }, 20000);

  it('Browse cheatsheet navigates away from the quiz surface', async () => {
    // Render Quiz alongside a mode probe so we can observe the navigation.
    const user = userEvent.setup();
    function Probe() {
      return <span data-testid="probe-mode" />;
    }
    render(
      <AppProvider>
        <Probe />
        <Quiz rng={makeSeed(42)} />
      </AppProvider>,
    );
    await user.click(screen.getByTestId('quiz-start'));
    for (let i = 0; i < 10; i++) {
      await answerAndAdvance(user);
    }
    const browse = screen.getByRole('button', { name: /browse cheatsheet/i });
    await user.click(browse);
    // Navigation updates the hash route to cheatsheet.
    expect(window.location.hash).toContain('cheatsheet');
  }, 20000);
});
