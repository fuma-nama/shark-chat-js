import Image from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "ui/utils/cn";

interface BannerImageProps extends HTMLAttributes<HTMLDivElement> {
  url: string | null;
}
export const BannerImage = forwardRef<HTMLDivElement, BannerImageProps>(
  ({ url, className, ...props }, ref) => {
    if (url) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative aspect-[3] bg-card overflow-hidden -mx-4",
            className,
          )}
          {...props}
        >
          <Image
            priority
            alt="Banner"
            fill
            sizes="(max-width: 800px) 90vw, 800px"
            src={url}
            loader={cloudinaryLoader}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "h-auto aspect-[3] bg-gradient-to-b from-brand to-brand-300 -mx-4",
          className,
        )}
        {...props}
      />
    );
  },
);

BannerImage.displayName = "BannerImage";
