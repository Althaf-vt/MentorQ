import { cloneElement, useId, useState, type ReactElement, type ReactNode } from 'react';

export type TooltipProps = {
  children: ReactElement<{ 'aria-describedby'?: string }>;
  content: ReactNode;
};

export function Tooltip({ children, content }: TooltipProps) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  const description = [children.props['aria-describedby'], id].filter(Boolean).join(' ');
  return (
    <span className="mqds-tooltip" data-dismissed={dismissed}
      onKeyDown={event => {
        if (event.key === 'Escape' && !dismissed) {
          event.stopPropagation();
          event.preventDefault();
          setDismissed(true);
        }
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDismissed(false);
      }}
      onMouseLeave={() => setDismissed(false)}>
      {cloneElement(children, { 'aria-describedby': description })}
      <span id={id} className="mqds-tooltip-content" role="tooltip">{content}</span>
    </span>
  );
}
