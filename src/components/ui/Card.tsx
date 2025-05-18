import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
}

export function Card({ 
  className, 
  clickable = false, 
  children, 
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        'card',
        clickable && 'hover:scale-[1.02] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('p-4 border-b border-gray-200 dark:border-gray-700', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div
      className={cn('p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('p-4 border-t border-gray-200 dark:border-gray-700', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  height?: number;
}

export function CardImage({ 
  className, 
  src, 
  alt,
  height = 200,
  ...props 
}: CardImageProps) {
  return (
    <div className={cn('relative w-full overflow-hidden', className)} style={{ height }} {...props}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
      />
    </div>
  );
} 