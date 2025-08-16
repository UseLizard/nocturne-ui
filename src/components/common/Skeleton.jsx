import React from 'react';

const Skeleton = ({ className }) => <div className={`bg-black/5 dark:bg-white/5 animate-pulse rounded-lg ${className}`} />;

export default Skeleton;
