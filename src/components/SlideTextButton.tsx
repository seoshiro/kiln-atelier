// Adapted from Kokonut UI SlideTextButton, MIT, copyright Kokonut Labs.
// Source 590ded728c3414f871607a5d0662f9e70941d054; license: public/licenses/kokonut-ui.txt.
// Native action semantics, no entrance motion; touch/keyboard/reduced-motion remain still.
import type { ComponentProps, ReactNode } from 'react';
import { Button } from './ui/Button';

type Props = ComponentProps<typeof Button> & { text: string; icon?: ReactNode };

export function SlideTextButton({ text, icon, className = '', ...props }: Props) {
  return <Button className={`slide-text-button ${className}`} {...props}>
    <span className="slide-text-window"><span className="slide-text-track">
      <span className="slide-text-label">{text}</span>
      <span className="slide-text-copy" aria-hidden="true">{text}</span>
    </span></span>{icon}
  </Button>;
}
