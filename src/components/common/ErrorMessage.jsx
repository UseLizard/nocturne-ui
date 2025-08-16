import React from 'react';

// A generic refresh icon component. In a real app, this would likely be an SVG.
const RefreshIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 4v5h-5M4 20v-5h5"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4l16 16M20 4L4 20"></path>
  </svg>
);


const ErrorMessage = ({
  message = 'An unexpected error occurred.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center text-white/70 ${className}`} role="alert">
      <p className="mb-4 text-lg">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none bg-white/5 hover:bg-white/10 text-white/80 flex items-center"
        >
          <RefreshIcon />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
