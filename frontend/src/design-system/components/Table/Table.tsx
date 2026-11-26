import { forwardRef, useId, type TableHTMLAttributes } from 'react';
import { lightTheme } from '../../themes/light';

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  caption: string;
  hideHeaders?: boolean;
};

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ caption, hideHeaders = false, children, className, ...props }, ref) => {
    const captionId = useId();

    return (
      <div className="mqds-table-scroll" data-mqds={lightTheme} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table {...props} ref={ref} className={['mqds-table', className].filter(Boolean).join(' ')}
          data-hide-headers={hideHeaders || undefined}>
          <caption id={captionId}>{caption}</caption>
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';
