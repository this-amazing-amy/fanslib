type LogoProps = {
  isOpen?: boolean;
  className?: string;
};

export const Logo = ({ isOpen = true, className = '' }: LogoProps) => <div
      className={`flex items-center font-bold cursor-default pointer-events-none select-none ${isOpen ? 'text-2xl' : 'text-lg gap-0'} ${className}`}
    >
      {isOpen ? (
        <>
          <span className="text-foreground">Fans</span>
          <span className="text-background bg-primary/70 rounded px-1">Lib</span>
        </>
      ) : (
        <>
          <span className="text-foreground">F</span>
          <span className="text-background bg-primary/70 rounded px-1">L</span>
        </>
      )}
    </div>;


