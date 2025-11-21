import { useRef, type ReactNode } from 'react';
import type { AriaTabListProps, AriaTabPanelProps } from 'react-aria';
import { useTab, useTabList, useTabPanel } from 'react-aria';
import type { Node, TabListState } from 'react-stately';
import { Item, useTabListState } from 'react-stately';
import { cn } from '~/lib/cn';

export type TabsProps<T extends object> = AriaTabListProps<T> & {
  className?: string;
  children: ReactNode;
};

export const Tabs = <T extends object>({ className, children, ...props }: TabsProps<T>) => {
  const state = useTabListState({ ...props, children });
  const ref = useRef<HTMLDivElement>(null);
  const { tabListProps } = useTabList(props, state, ref);

  return (
    <div className={className}>
      <div {...tabListProps} ref={ref} className="tabs tabs-bordered">
        {[...state.collection].map((item) => (
          <Tab key={item.key} item={item} state={state} />
        ))}
      </div>
      <TabPanel key={state.selectedItem?.key} state={state} />
    </div>
  );
};

type TabProps<T> = {
  item: Node<T>;
  state: TabListState<T>;
};

const Tab = <T extends object>({ item, state }: TabProps<T>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { tabProps } = useTab({ key: item.key }, state, ref);
  const isSelected = state.selectedKey === item.key;

  return (
    <div
      {...tabProps}
      ref={ref}
      className={cn('tab', isSelected && 'tab-active')}
    >
      {item.rendered}
    </div>
  );
};

type TabPanelProps<T> = AriaTabPanelProps & {
  state: TabListState<T>;
};

const TabPanel = <T extends object>({ state, ...props }: TabPanelProps<T>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { tabPanelProps } = useTabPanel(props, state, ref);

  return (
    <div {...tabPanelProps} ref={ref} className="py-4">
      {state.selectedItem?.props.children}
    </div>
  );
};

export { Item as TabItem };

