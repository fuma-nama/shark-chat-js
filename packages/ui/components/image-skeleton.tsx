import { ReactNode } from "react";
import { Spinner } from "./spinner";

export type ImageSkeletonProps = {
  loaded: boolean;
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  children: ReactNode;
};

export function ImageSkeleton({
  loaded,
  width,
  height,
  maxWidth,
  maxHeight,
  children,
}: ImageSkeletonProps) {
  const ratio = Math.min(
    width > height ? maxWidth / width : maxHeight / height,
    1,
  );

  return (
    <div
      className="relative w-auto mt-3 rounded-xl overflow-hidden"
      style={{
        maxWidth: width * ratio,
        maxHeight: height * ratio,
        aspectRatio: width / height,
      }}
    >
      {children}
      {!loaded && (
        <div className="flex flex-col justify-center items-center absolute inset-0 bg-light-100 dark:bg-dark-700">
          <Spinner size="medium" />
        </div>
      )}
    </div>
  );
}
