import type { ReactNode } from 'react';

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="luxury-surface empty-state p-4 p-lg-5 text-center">
      {eyebrow && <p className="text-uppercase luxury-muted small mb-2">{eyebrow}</p>}
      <h4 className="mb-2">{title}</h4>
      {description && <p className="luxury-muted mb-4">{description}</p>}
      {action}
    </div>
  );
}
