import { ArrowLeftSquare, ArrowRightSquare } from 'lucide-react';
import { type ReactNode, createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Button } from '../Button';
import { Logo } from '../Logo';

type SidebarContextType = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a Sidebar or SidebarProvider');
  }
  return context;
};

type SidebarProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export const Sidebar = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className = '',
}: SidebarProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const open = controlledOpen ?? internalOpen;

  const setOpen = useCallback((newOpen: boolean) => {
    onOpenChange?.(newOpen);
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
  }, [onOpenChange, controlledOpen]);

  const toggleSidebar = () => setOpen(!open);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'b' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const state = open ? 'expanded' : 'collapsed';

  return (
    <SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar }}>
      <div
        data-sidebar="root"
        data-state={state}
        className={`group relative flex h-full flex-col border-r bg-background transition-[width] duration-300 ${open ? 'w-64' : 'w-16'} ${className}`}
      >
        <div
          className={`flex py-4 items-center justify-between border-b px-4 ${!open ? 'flex-col gap-2' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Logo isOpen={open} />
          </div>
          <SidebarTrigger className="bg-background/80 hover:bg-background/90 transition-all duration-200 ease-out hover:ring-1 hover:ring-border cursor-pointer" />
        </div>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

type SidebarProviderProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export const SidebarProvider = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className = '',
}: SidebarProviderProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const open = controlledOpen ?? internalOpen;

  const setOpen = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
  };

  const toggleSidebar = () => setOpen(!open);

  const state = open ? 'expanded' : 'collapsed';

  return (
    <SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar }}>
      <div className={`flex min-h-screen w-full ${className}`}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

type SidebarTriggerProps = {
  className?: string;
};

export const SidebarTrigger = ({ className = '' }: SidebarTriggerProps) => {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      data-sidebar="trigger"
      className={`h-9 w-9 shrink-0 ${className}`}
    >
      {state === 'expanded' ? (
        <ArrowLeftSquare className="h-4 w-4" />
      ) : (
        <ArrowRightSquare className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

type SidebarHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarHeader = ({ children, className = '' }: SidebarHeaderProps) => <div data-sidebar="header" className={`flex flex-col gap-2 p-2 ${className}`}>
      {children}
    </div>;

type SidebarFooterProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarFooter = ({ children, className = '' }: SidebarFooterProps) => <div data-sidebar="footer" className={`flex flex-col gap-2 p-2 ${className}`}>
      {children}
    </div>;

type SidebarContentProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarContent = ({ children, className = '' }: SidebarContentProps) => <div className={`flex-1 overflow-hidden ${className}`}>
      {children}
    </div>;

type SidebarGroupProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarGroup = ({ children, className = '' }: SidebarGroupProps) => <div className={`px-2 py-2 ${className}`}>
      {children}
    </div>;

type SidebarGroupLabelProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarGroupLabel = ({ children, className = '' }: SidebarGroupLabelProps) => {
  const { state } = useSidebar();
  return state === 'expanded' ? (
    <div className={`px-2 py-1.5 text-xs font-medium text-muted-foreground ${className}`}>
      {children}
    </div>
  ) : null;
};

type SidebarGroupContentProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarGroupContent = ({ children, className = '' }: SidebarGroupContentProps) => <div className={`space-y-1 ${className}`}>
      {children}
    </div>;

type SidebarMenuProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarMenu = ({ children, className = '' }: SidebarMenuProps) => <div className={className}>
      {children}
    </div>;

type SidebarMenuItemProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarMenuItem = ({ children, className = '' }: SidebarMenuItemProps) => <div className={className}>
      {children}
    </div>;

type SidebarMenuButtonProps = {
  children: ReactNode;
  isActive?: boolean;
  asChild?: boolean;
  className?: string;
  onClick?: () => void;
};

export const SidebarMenuButton = ({
  children,
  isActive = false,
  asChild = false,
  className = '',
  onClick,
}: SidebarMenuButtonProps) => {
  const { state } = useSidebar();

  const baseClasses = `flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-all hover:bg-base-200 ${state === 'collapsed' ? 'justify-center' : ''} ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}`;

  if (asChild) {
    return <div className={`${baseClasses} ${className}`}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
};

type SidebarInsetProps = {
  children: ReactNode;
  className?: string;
};

export const SidebarInset = ({ children, className = '' }: SidebarInsetProps) => <main className={`relative flex min-h-screen flex-1 flex-col bg-background ${className}`}>
      {children}
    </main>;

