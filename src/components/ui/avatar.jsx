'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/utils';

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(({ className, src, ...props }, ref) => {
  const useCachedImage = (url) => {
    return useQuery({
      queryKey: ['image', url],
      queryFn: async () => {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      },
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    });
  };
  // const data = useCachedImage(src);
  // console.log(data)
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
