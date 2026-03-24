/**
 * JobBoat Logo -- Organic starburst with strategic accent gradient.
 * Represents infinite thinking, connectivity, and career navigation.
 */
export default function JobBoatLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="jb-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      {/* Organic starburst core */}
      <circle cx="32" cy="32" r="8" fill="url(#jb-star-grad)" />
      {/* Main branches radiating outward */}
      <path
        d="M32 24 L32 16 M32 40 L32 48 M24 32 L16 32 M40 32 L48 32"
        stroke="url(#jb-star-grad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Diagonal branches */}
      <path
        d="M28 28 L22 22 M36 28 L42 22 M28 36 L22 42 M36 36 L42 42"
        stroke="url(#jb-star-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Secondary sub-branches */}
      <path
        d="M32 20 L30 18 L32 16 L34 18 M32 44 L30 46 L32 48 L34 46 M20 32 L18 30 L16 32 L18 34 M44 32 L46 30 L48 32 L46 34"
        stroke="url(#jb-star-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Additional organic branches */}
      <path
        d="M26 26 L24 24 M38 26 L40 24 M26 38 L24 40 M38 38 L40 40"
        stroke="url(#jb-star-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Compact mark version for small spaces (nav, favicon).
 */
export function JobBoatMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="jb-mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="6" fill="url(#jb-mark-grad)" />
      <path
        d="M24 18 L24 12 M24 30 L24 36 M18 24 L12 24 M30 24 L36 24"
        stroke="url(#jb-mark-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 20 L16 16 M28 20 L32 16 M20 28 L16 32 M28 28 L32 32"
        stroke="url(#jb-mark-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
