const TavernLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Tankard body - rounded, warm shape */}
    <path
      d="M8 10C8 9 9 8 10 8H20C21 8 22 9 22 10V24C22 26 20 28 18 28H12C10 28 8 26 8 24V10Z"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Handle */}
    <path
      d="M22 13C24 13 26 14.5 26 17C26 19.5 24 21 22 21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Foam */}
    <path
      d="M7.5 10C7.5 10 9 7 11 7C13 7 13.5 9 15 9C16.5 9 17 7 19 7C21 7 22.5 10 22.5 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Sparkle */}
    <circle cx="13" cy="5" r="0.8" fill="currentColor" opacity="0.6" />
    <circle cx="17" cy="3.5" r="0.6" fill="currentColor" opacity="0.4" />
  </svg>
);

export default TavernLogo;
