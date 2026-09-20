import type { HTMLAttributes } from 'react';
import './local.css';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <article {...props} className={['wb-card', className].filter(Boolean).join(' ')} />;
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['wb-card__header', className].filter(Boolean).join(' ')} />;
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={['wb-card__title', className].filter(Boolean).join(' ')} />;
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={['wb-card__description', className].filter(Boolean).join(' ')} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['wb-card__content', className].filter(Boolean).join(' ')} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['wb-card__footer', className].filter(Boolean).join(' ')} />;
}
