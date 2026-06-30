// src/components/quiz/quizTypes.ts
import type { CatalogItem, KeyChord } from '../../data/types';

export type QuestionKind = 'name-to-summary' | 'summary-to-name' | 'type-shortcut';

export type Rng = () => number;

export type AnswerState = { correct: boolean; given: string };

interface BaseQuestion {
  id: string;
  kind: QuestionKind;
  item: CatalogItem;
  prompt: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: 'name-to-summary' | 'summary-to-name';
  options: string[]; // exactly 4, all distinct
  answerIndex: number; // index of the correct option in `options`
}

export interface ShortcutQuestion extends BaseQuestion {
  kind: 'type-shortcut';
  chord: KeyChord; // the correct chord to press
}

export type Question = ChoiceQuestion | ShortcutQuestion;
