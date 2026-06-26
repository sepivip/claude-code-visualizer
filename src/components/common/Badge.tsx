import type { ReactNode } from 'react';

type BadgeVariant = 'advanced' | 'domain' | 'category';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  advanced: 'cc-badge-advanced border-cc-accent text-cc-accent',
  domain: 'cc-badge-domain border-cc-green text-cc-green',
  category: 'cc-badge-category border-cc-muted text-cc-muted',
};

export function Badge({ variant = 'advanced', children }: BadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${VARIANT_CLASS[variant]}`}
    >
      {children}
    </span>
  );
}
