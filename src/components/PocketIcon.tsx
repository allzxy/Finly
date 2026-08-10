interface Props {
  className?: string;
  size?: number;
}

export default function PocketIcon({ className = '', size = 28 }: Props) {
  return (
    <img
      src="/logo.png"
      alt="Finly App Logo"
      width={size}
      height={size}
      className={`object-contain rounded-xl shrink-0 shadow-xs ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
