export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <circle cx="16" cy="16" r="11" stroke="#E0A64B" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="2.4" fill="#E0A64B" />
      <path
        d="M16 2v5M16 25v5M2 16h5M25 16h5"
        stroke="#E0A64B"
        strokeWidth="1.4"
      />
      <circle cx="16" cy="7.5" r="0.9" fill="#E0A64B" opacity="0.55" />
      <circle cx="16" cy="24.5" r="0.9" fill="#E0A64B" opacity="0.55" />
      <circle cx="7.5" cy="16" r="0.9" fill="#E0A64B" opacity="0.55" />
      <circle cx="24.5" cy="16" r="0.9" fill="#E0A64B" opacity="0.55" />
    </svg>
  );
}
