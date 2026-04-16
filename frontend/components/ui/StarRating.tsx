'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  size = 20,
  interactive = false,
  onRatingChange,
  className = '',
}: StarRatingProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const active = starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starValue)}
            className={`transition-all duration-150 ${
              interactive ? 'hover:scale-110 active:scale-95' : 'cursor-default'
            }`}
          >
            <Star
              size={size}
              strokeWidth={2}
              className={`${
                active
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-border fill-transparent hover:text-amber-300'
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
