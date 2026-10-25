import type { ReactNode } from 'react';

export type StateNoticeKind = 'loading' | 'error' | 'unavailable';

type StateNoticeProps = {
  kind: StateNoticeKind;
  title: string;
  children: ReactNode;
};

const stateSymbols: Record<StateNoticeKind, string> = {
  loading: '↻',
  error: '!',
  unavailable: 'i',
};

export function StateNotice({ kind, title, children }: StateNoticeProps) {
  return (
    <div
      className={`state-notice state-notice-${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-label={title}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      <span className="state-notice-symbol" aria-hidden="true">
        {stateSymbols[kind]}
      </span>
      <div className="state-notice-copy">
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}
