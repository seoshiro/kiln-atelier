# Interaction libraries

Kokonut UI + shadcn/ui source components

The two export actions use a native shadcn Button adaptation and Kokonut SlideTextButton. The original CSS two-label grid is retained; duplicate labels are hidden from assistive technology. Only a fine pointer hover slides the label, for 180 ms. Touch, keyboard and reduced motion stay still; exports start immediately.

These are free MIT implementations, with upstream notices in public/licenses. No account, paid component, source upload or tracking is required. Only the components used by the existing interface are included. Vite/plain CSS adaptations do not install Next.js or Tailwind.

Design guidance: official Vercel Web Interface Guidelines and Emil Kowalski's public emil-design-eng skill: native actions, visible focus, stable accessible names, short interruptible feedback, transform/opacity only and reduced-motion support.
