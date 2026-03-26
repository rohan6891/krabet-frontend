"use client";

import { useState } from "react";

type GameImageWithSkeletonProps = {
  src: string;
  alt: string;
  className: string;
};

export function GameImageWithSkeleton({ src, alt, className }: GameImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="image-skeleton-wrap">
      {!loaded && <div className="skeleton-block image-skeleton" aria-hidden="true" />}
      {!failed ? (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loaded ? "is-loaded" : "is-loading"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      ) : null}
    </div>
  );
}
