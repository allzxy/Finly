interface Props {
  className?: string;
  size?: number;
}

export default function PocketIcon({ className = '', size = 28 }: Props) {
  return (
    <img
      src="/logo.png"
      alt="Finly Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain select-none pointer-events-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
