// Native-button adaptation of shadcn/ui Button (MIT, shadcn).
// Upstream ffd225775bbb7955a673f08bb9be4a63600d9dfb; see public/licenses/shadcn-ui.txt.
// This atelier needs no polymorphic Slot, Tailwind runtime or additional variants.
import type { ComponentProps } from 'react';
import './button.css';

type ButtonProps = ComponentProps<'button'> & { variant?: 'default' | 'ghost' };

export function Button({ className = '', variant = 'default', type = 'button', ...props }: ButtonProps) {
  return <button data-slot="button" data-variant={variant} data-size="default" type={type} className={`ui-button ${className}`} {...props} />;
}
