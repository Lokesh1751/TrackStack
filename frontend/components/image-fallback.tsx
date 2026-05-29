"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

type Props = ImageProps & {
  fallback?: React.ReactNode;
};

export function ImageWithFallback({
  src,
  alt,
  fallback,
  ...props
}: Props) {
  const validSrc =
    typeof src === "string" && src.trim() === "" ? null : src;

  const [imgSrc, setImgSrc] = useState(validSrc);
  const [hasError, setHasError] = useState(false);

  if (!imgSrc || hasError) {
    return (
      fallback || (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
          <ImageOff className="h-8 w-8" />
        </div>
      )
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setHasError(true);
      }}
    />
  );
}