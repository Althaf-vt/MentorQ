import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-subtle' | 'text';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', type = 'button', className, ...props }, ref) => (
    <button {...props} ref={ref} type={type}
      className={['mqds-button', className].filter(Boolean).join(' ')} data-variant={variant} />
  )
);
Button.displayName = 'Button';
