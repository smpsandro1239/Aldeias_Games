import * as React from "react";
import Image, { type ImageProps } from "next/image";

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source (optional for fallback-only usage) */
  src?: string;
  /** Fallback content when image fails to load */
  fallback?: React.ReactNode;
  /** Size of the avatar */
  size?: number;
  /** Whether to use circular shape (default: true) */
  circular?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Avatar component with fallback and optional circular shape
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  fallback,
  size = 40,
  circular = true,
  className = "",
  ...props
}) => {
  const { width, height, ...restProps } = props; // Remove width and height because we use fill
  const avatarClassName = `
    relative flex h-${size} w-${size} shrink-0 overflow-hidden
    ${circular ? "rounded-full" : "rounded"}
    ${className}
  `;

  return (
    <div className={avatarClassName}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          priority
          className="object-cover h-full w-full"
          {...restProps}
        />
      ) : null}
      {!src && fallback ? (
        <div className="flex items-center justify-center w-full h-full text-sm font-medium">{fallback}</div>
      ) : null}
      {!src && !fallback ? (
        <div className="flex items-center justify-center w-full h-full text-sm font-medium">
          {"?"}
        </div>
      ) : null}
    </div>
  );
};

/**
 * AvatarImage - wrapper for Avatar with only src prop (for compatibility)
 */
export const AvatarImage: React.FC<{ src: string; alt?: string; className?: string }> = ({
  src,
  alt,
  className = ""
}) => (
  <Avatar src={src} fallback={alt ? <span>{alt}</span> : null} className={className} />
);

/**
 * AvatarFallback - wrapper for Avatar with only fallback content
 */
export const AvatarFallback: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = ""
}) => (
  <Avatar fallback={children ?? <span>?</span>} className={className} />
);

// Export NextImage for direct usage if needed
export type { ImageProps };
export { Image as NextImage };
