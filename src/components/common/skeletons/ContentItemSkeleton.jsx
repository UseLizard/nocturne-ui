import React from 'react';
import Skeleton from '../Skeleton';

const ContentItemSkeleton = ({ shape = 'square' }) => {
  const shapeClass = shape === 'square' ? 'rounded-[12px]' : 'rounded-full';

  return (
    <div className="min-w-[280px] pl-2 mr-10 snap-start">
      <Skeleton 
        className={`mt-10 aspect-square drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)] ${shapeClass}`}
        style={{ width: 280, height: 280 }}
      />
      <Skeleton className="mt-4 h-8 w-48 rounded" />
      <Skeleton className="mt-2 h-7 w-40 rounded" />
    </div>
  );
};

export default ContentItemSkeleton;
