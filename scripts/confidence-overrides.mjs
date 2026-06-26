// Confidence-override policy layer.
//
// POLICY:
//   - Core, newcomer-facing items (shortcuts, common slash commands, the flags
//     and settings a beginner will actually touch) MUST be 'verified'. They are
//     taught as fact, so they must be correct. List them in VERIFIED.
//   - Real-but-bleeding-edge / uncertain items (unreleased or unstable hook
//     events, experimental flags, internal-sounding settings) are BADGED
//     'advanced', not hidden. Newcomers see them flagged so they don't trust
//     them blindly. List them in ADVANCED.
//   - Clearly-wrong / hallucinated items must NOT be demoted here — DELETE them
//     from content/cc-catalog.raw.json so they never reach the catalog at all.
//
// This file is the single source of truth for confidence corrections;
// transform.mjs applies it deterministically so a rebuild is reproducible.
// Entries are matched by item NAME (not id).

/** Names that must be promoted to 'verified' (core newcomer items). */
export const VERIFIED = [
  'Ctrl+C',
  'Ctrl+L',
  'Ctrl+R',
  'Esc',
  '/clear',
  '/help',
  '/init',
  '/model',
  '--print',
  '--continue',
  '--resume',
  'CLAUDE.md',
];

/** Names that are real but uncertain/bleeding-edge — demote to 'advanced'. */
export const ADVANCED = [
  '--teammate-mode',
  'teammateMode',
  'advisorModel',
  'Elicitation hook event',
  'ElicitationResult hook event',
  'TeammateIdle hook event',
  'ConfigChange hook event',
  'CwdChanged hook event',
  'FileChanged hook event',
  'WorktreeCreate hook event',
  'WorktreeRemove hook event',
  'PostToolBatch hook event',
  'PostToolUseFailure hook event',
  '--exclude-dynamic-system-prompt-sections',
  '--replay-user-messages',
];
