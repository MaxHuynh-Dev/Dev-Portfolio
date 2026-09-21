'use client';

import Image, { type ImageProps } from 'next/image';
import type React from 'react';
import { cn } from '@/lib/utils';

interface ImagePlaceHolderProps extends ImageProps {
  isFull?: boolean;
  className?: string;
}

function ImagePlaceHolder({
  src,
  alt,
  width,
  height,
  isFull = false,
  className
}: ImagePlaceHolderProps): React.JSX.Element {
  return (
    <div className="relative h-full w-full text-[0] leading-0">
      <Image
        className={cn('h-full w-full object-cover', className)}
        loading="eager"
        src={src}
        alt={alt}
        width={50}
        height={50}
      />
      <Image
        src={src}
        alt={alt}
        onLoad={(e) => {
          (e.target as HTMLImageElement).classList.add('opacity-100');
        }}
        sizes={
          isFull
            ? '100vw'
            : `(min-width: ${String(width ?? 100)}px) ${String(width ?? 100)}px, 100vw`
        }
        width={width}
        height={height}
        className="absolute top-0 left-0 h-full w-full object-cover opacity-0 transition-opacity duration-400 will-change-opacity"
      />
    </div>
  );
}

export default ImagePlaceHolder;
