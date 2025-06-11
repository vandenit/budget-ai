interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

const Loading = ({ size = 'lg', text, fullPage = false }: LoadingProps) => {
  const sizeClass = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <span className={`loading loading-spinner ${sizeClass}`}></span>
      {text && (
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
