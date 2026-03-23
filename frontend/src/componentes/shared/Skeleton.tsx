import './Skeleton.css';

type SkeletonVariant = 'text' | 'card' | 'image';

type SkeletonProps = {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
  };

  const variantClass =
    variant === 'card'
      ? 'ph-skeletonCard'
      : variant === 'image'
        ? 'ph-skeletonImage'
        : 'ph-skeletonText';

  return <div className={`ph-skeleton ${variantClass} ${className}`.trim()} style={style} aria-hidden="true" />;
}
