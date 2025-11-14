type LogoProps = {
  isCollapsed: boolean;
};

export const Logo = ({ isCollapsed }: LogoProps) => {
  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <div className="px-3 py-1.5 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-content font-bold text-lg">Fans</span>
        </div>
        <span className="text-xl font-bold">Lib</span>
      </div>
      {isCollapsed ? (
        <div className="hidden lg:flex items-center gap-1">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-content font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold">L</span>
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-2">
          <div className="px-3 py-1.5 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-content font-bold text-xl">Fans</span>
          </div>
          <span className="text-2xl font-bold">Lib</span>
        </div>
      )}
    </>
  );
};

