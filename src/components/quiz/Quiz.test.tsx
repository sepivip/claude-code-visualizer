// src/components/quiz/Quiz.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../shell/AppContext';
import { CATALOG } from '../../data/catalog';
import { Quiz } from './Quiz';
import { generateQuestions } from './generator';
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

  it('clicking the correct option deterministically scores a point', async () => {
    const user = userEvent.setup();

    // Build the exact questions the surface will render: call the generator
    // with a FRESH seeded rng using the SAME defaults the Quiz uses internally
    // (count 10, category 'all'), then render <Quiz> with an identical fresh
    // seeded rng. Because the rng sequences match, the rendered first question
    // equals expected[0], so we know its correct answerIndex.
    const SEED = 5; // seed whose first question is a 4-option choice question
    const expected = generateQuestions(CATALOG, {
      count: 10,
      category: 'all',
      rng: makeSeed(SEED),
    });
    const first = expected[0];
    expect(first.kind === 'name-to-summary' || first.kind === 'summary-to-name').toBe(true);
    if (first.kind === 'type-shortcut') throw new Error('seed regressed: expected a choice question');

    renderQuiz(makeSeed(SEED));
    await user.click(screen.getByTestId('quiz-start'));

    // Score and streak both start at 0.
    expect(screen.getByTestId('quiz-score')).toHaveTextContent('Score: 0');
    expect(screen.getByTestId('quiz-score')).toHaveTextContent('Streak: 0');

    const options = screen.getAllByTestId('quiz-option');
    expect(options).toHaveLength(4);
    // Sanity: the rendered option matches the generated correct option text.
    expect(options[first.answerIndex]).toHaveTextContent(first.options[first.answerIndex]);

    // Click the KNOWN-correct option.
    await user.click(options[first.answerIndex]);

    // The correct answer is worth exactly one point and one streak.
    expect(screen.getByTestId('quiz-score')).toHaveTextContent('Score: 1');
    expect(screen.getByTestId('quiz-score')).toHaveTextContent('Streak: 1');
    // Feedback shows and the clicked option is highlighted green.
    expect(screen.getByTestId('quiz-next')).toBeInTheDocument();
    expect(options[first.answerIndex].className).toContain('text-cc-green');
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
