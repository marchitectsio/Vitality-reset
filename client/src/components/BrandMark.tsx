interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: {
    container: 'w-12 h-12 sm:w-14 sm:h-14',
    image: 'w-10 h-10 sm:w-11 sm:h-11',
  },
  md: {
    container: 'w-20 h-20 sm:w-24 sm:h-24',
    image: 'w-16 h-16 sm:w-20 sm:h-20',
  },
  lg: {
    container: 'w-24 h-24 sm:w-28 sm:h-28',
    image: 'w-20 h-20 sm:w-24 sm:h-24',
  },
};

export function BrandMark({ size = 'md', showText = false, className = '' }: BrandMarkProps) {
  const sizeClasses = sizes[size];
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/branding/wellness-escape-badge.png" 
        alt="Wellness Escape" 
        className={`${sizeClasses.container} object-contain drop-shadow-md`}
      />
      {showText && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Wellness Escape
          </p>
        </div>
      )}
    </div>
  );
}
