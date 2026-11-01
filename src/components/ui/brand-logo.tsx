'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
  priority?: boolean;
}

const SIZES = {
  sm: { width: 32, height: 32, className: 'h-8 w-auto' },
  md: { width: 48, height: 48, className: 'h-12 w-auto' },
  lg: { width: 72, height: 72, className: 'h-16 sm:h-20 w-auto' },
  xl: { width: 96, height: 96, className: 'h-24 w-auto' },
} as const;

export function BrandLogo({ size = 'sm', href, className = '', priority }: BrandLogoProps) {
  const config = SIZES[size];

  const imageElement = (
    <div className={`inline-flex items-center select-none ${className}`}>
      <Image
        src="/brand/logo.png"
        alt="RKT Tennis"
        width={config.width}
        height={config.height}
        className={`${config.className} object-contain drop-shadow-sm`}
        priority={priority}
      />
      <span className="sr-only">RKT Tennis</span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href as any}
        className="inline-flex items-center transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-volt rounded-lg"
        aria-label="Ir para a página inicial"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}

