import type { MediaFilter } from '@fanslib/server/schemas';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { VirtualPost } from '~/lib/virtual-posts';

type FloatingPost = {
  virtualPost: VirtualPost;
  initialBounds: DOMRect;
};

type InlinePickerState = {
  isOpen: boolean;
  virtualPost: VirtualPost | null;
  anchorBounds: DOMRect | null;
  filters: MediaFilter;
  floatingPost: FloatingPost | null;
};

// Actions context - stable references, never causes re-renders
type InlinePickerActionsContextValue = {
  openPicker: (virtualPost: VirtualPost, anchorBounds: DOMRect, initialFilters: MediaFilter) => void;
  closePicker: () => void;
  setFilters: (filters: MediaFilter) => void;
  selectVirtualPost: (virtualPost: VirtualPost, filters: MediaFilter) => void;
  setFloatingPost: (virtualPost: VirtualPost, initialBounds: DOMRect, filters: MediaFilter) => void;
  clearFloatingPost: () => void;
  clearSelection: () => void;
  setOnPostCreated: (callback: (() => void) | null) => void;
};

// State context - changes trigger re-renders for subscribers
type InlinePickerStateContextValue = {
  state: InlinePickerState;
  onPostCreated: (() => void) | null;
};

// Combined for backwards compatibility
type InlinePickerContextValue = InlinePickerActionsContextValue & InlinePickerStateContextValue;

const InlinePickerActionsContext = createContext<InlinePickerActionsContextValue | null>(null);
const InlinePickerStateContext = createContext<InlinePickerStateContextValue | null>(null);

type InlinePickerProviderProps = {
  children: ReactNode;
};

export const InlinePickerProvider = ({ children }: InlinePickerProviderProps) => {
  const [state, setState] = useState<InlinePickerState>({
    isOpen: false,
    virtualPost: null,
    anchorBounds: null,
    filters: [],
    floatingPost: null,
  });
  const [onPostCreated, setOnPostCreated] = useState<(() => void) | null>(null);
  
  // Use ref to access onPostCreated without adding it as dependency
  const onPostCreatedRef = useRef(onPostCreated);
  onPostCreatedRef.current = onPostCreated;

  const openPicker = useCallback((virtualPost: VirtualPost, anchorBounds: DOMRect, initialFilters: MediaFilter) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      virtualPost,
      anchorBounds,
      filters: initialFilters,
    }));
  }, []);

  const closePicker = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
    // Trigger callback if set (use ref to avoid dependency)
    onPostCreatedRef.current?.();
  }, []);

  const setFilters = useCallback((filters: MediaFilter) => {
    setState(prev => ({
      ...prev,
      filters,
    }));
  }, []);

  // Select a virtual post without opening the bottom sheet (for large screens)
  const selectVirtualPost = useCallback((virtualPost: VirtualPost, filters: MediaFilter) => {
    setState(prev => ({
      ...prev,
      virtualPost,
      filters,
      isOpen: false, // Don't open the picker
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      virtualPost: null,
      filters: [],
      floatingPost: null,
    }));
  }, []);

  // Set floating post with bounds for animation (large screens)
  const setFloatingPost = useCallback((virtualPost: VirtualPost, initialBounds: DOMRect, filters: MediaFilter) => {
    setState(prev => ({
      ...prev,
      virtualPost,
      filters,
      floatingPost: { virtualPost, initialBounds },
      isOpen: false,
    }));
  }, []);

  const clearFloatingPost = useCallback(() => {
    setState(prev => ({
      ...prev,
      floatingPost: null,
    }));
  }, []);

  // Actions are stable - never change reference
  const actions = useMemo(() => ({
    openPicker,
    closePicker,
    setFilters,
    selectVirtualPost,
    setFloatingPost,
    clearFloatingPost,
    clearSelection,
    setOnPostCreated,
  }), [openPicker, closePicker, setFilters, selectVirtualPost, setFloatingPost, clearFloatingPost, clearSelection]);

  // State changes trigger re-renders for state subscribers only
  const stateValue = useMemo(() => ({
    state,
    onPostCreated,
  }), [state, onPostCreated]);

  return (
    <InlinePickerActionsContext.Provider value={actions}>
      <InlinePickerStateContext.Provider value={stateValue}>
        {children}
      </InlinePickerStateContext.Provider>
    </InlinePickerActionsContext.Provider>
  );
};

// Use this when you only need actions (won't re-render on state changes)
export const useInlinePickerActions = () => {
  const context = useContext(InlinePickerActionsContext);
  if (!context) {
    throw new Error('useInlinePickerActions must be used within an InlinePickerProvider');
  }
  return context;
};

// Use this when you need to read state (will re-render on state changes)
export const useInlinePickerState = () => {
  const context = useContext(InlinePickerStateContext);
  if (!context) {
    throw new Error('useInlinePickerState must be used within an InlinePickerProvider');
  }
  return context;
};

// Combined hook for backwards compatibility (re-renders on state changes)
export const useInlinePicker = (): InlinePickerContextValue => {
  const actions = useContext(InlinePickerActionsContext);
  const stateContext = useContext(InlinePickerStateContext);
  if (!actions || !stateContext) {
    throw new Error('useInlinePicker must be used within an InlinePickerProvider');
  }
  return { ...actions, ...stateContext };
};
