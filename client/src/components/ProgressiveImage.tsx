/**
 * ProgressiveImage — Displays images with a skeleton loading state
 * and a blur-to-sharp transition once loaded.
 * Handles slow networks gracefully with visual feedback.
 */
import { useState, useEffect, useRef } from "react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  skeletonClassName?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  /** Optional low-res placeholder (data URI or tiny image URL) */
  placeholder?: string;
}

export default function ProgressiveImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  skeletonClassName = "",
  objectFit = "cover",
  placeholder,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Check if image is already cached (loaded instantly)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const objectFitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
  }[objectFit];

  if (!src || hasError) {
    return (
      <div className={`relative overflow-hidden ${containerClassName}`}>
        <div className={`absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center ${skeletonClassName}`}>
          <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Skeleton / blur placeholder layer */}
      {!isLoaded && (
        <div className={`absolute inset-0 ${skeletonClassName}`}>
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className={`w-full h-full ${objectFitClass} blur-lg scale-105`}
              aria-hidden="true"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200" />
          )}
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full ${objectFitClass} transition-opacity duration-500 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </div>
  );
}
