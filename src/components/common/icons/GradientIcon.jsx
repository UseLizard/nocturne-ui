export default function GradientIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient-icon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.7" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        ry="3"
        fill="url(#gradient-icon)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="16" cy="8" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}