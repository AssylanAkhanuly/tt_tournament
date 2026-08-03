/* Обратная связь: плашка, всплывающее уведомление, диалог.

   Диалог в витрине показан «как есть» (без портала и оверлея на весь экран):
   Storybook — про внешний вид, а поведение окна будет во `front/`. */

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import './feedback.css';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

const NOTICE_ICON: Record<NoticeTone, ReactNode> = {
  info: <Info size={17} />,
  success: <CheckCircle2 size={17} />,
  warning: <AlertTriangle size={17} />,
  danger: <XCircle size={17} />,
};

export function Notice({
  tone = 'info',
  title,
  text,
  action,
  className,
}: {
  tone?: NoticeTone;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('ui-notice', `ui-notice--${tone}`, className)}>
      <span className="ic">{NOTICE_ICON[tone]}</span>
      <span className="tx">
        <div className="t">{title}</div>
        {text && <div className="s">{text}</div>}
      </span>
      {action && <span className="act">{action}</span>}
    </div>
  );
}

const TOAST_ICON: Record<'info' | 'ok' | 'bad', ReactNode> = {
  info: <Info size={16} />,
  ok: <CheckCircle2 size={16} />,
  bad: <XCircle size={16} />,
};

export function Toast({
  tone = 'info',
  icon,
  title,
  text,
  className,
}: {
  tone?: 'info' | 'ok' | 'bad';
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('ui-toast', tone !== 'info' && tone, className)}>
      <span className="ic">{icon ?? TOAST_ICON[tone]}</span>
      <span>
        <div className="t">{title}</div>
        {text && <div className="s">{text}</div>}
      </span>
      <button type="button" className="x" aria-label="закрыть">
        <X size={15} />
      </button>
    </div>
  );
}

export function Modal({
  title,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('ui-modal-scrim', className)}>
      <div className="ui-modal">
        <div className="head">
          <span className="t">{title}</span>
          <button type="button" className="x" aria-label="закрыть">
            <X size={16} />
          </button>
        </div>
        <div className="body">{children}</div>
        {actions && <div className="foot">{actions}</div>}
      </div>
    </div>
  );
}
