import type { Meta, StoryObj } from '@storybook/react';
import {
  FileText,
  Settings,
  User,
  Mail,
  Calendar,
  Folder,
  Search,
  Plus,
  Edit,
  Trash,
} from 'lucide-react';
import { Command } from './Command';
import type { CommandItem, CommandGroup } from './Command';

const meta: Meta<typeof Command> = {
  title: 'UI/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Command>;

const simpleItems: CommandItem[] = [
  {
    id: 'file',
    label: 'New File',
    description: 'Create a new file',
    icon: <FileText className="h-4 w-4" />,
    keywords: ['create', 'document'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open application settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['preferences', 'config'],
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'View your profile',
    icon: <User className="h-4 w-4" />,
    keywords: ['account', 'user'],
  },
  {
    id: 'mail',
    label: 'Mail',
    description: 'Check your inbox',
    icon: <Mail className="h-4 w-4" />,
    keywords: ['email', 'inbox'],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'View your schedule',
    icon: <Calendar className="h-4 w-4" />,
    keywords: ['schedule', 'events'],
  },
];

const groupedCommands: CommandGroup[] = [
  {
    id: 'files',
    label: 'Files',
    items: [
      {
        id: 'new-file',
        label: 'New File',
        description: 'Create a new file',
        icon: <Plus className="h-4 w-4" />,
      },
      {
        id: 'open-file',
        label: 'Open File',
        description: 'Open an existing file',
        icon: <Folder className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      {
        id: 'edit-file',
        label: 'Edit',
        description: 'Edit current file',
        icon: <Edit className="h-4 w-4" />,
      },
      {
        id: 'delete-file',
        label: 'Delete',
        description: 'Delete current file',
        icon: <Trash className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        id: 'preferences',
        label: 'Preferences',
        description: 'Open preferences',
        icon: <Settings className="h-4 w-4" />,
      },
      {
        id: 'profile',
        label: 'Profile',
        description: 'View profile settings',
        icon: <User className="h-4 w-4" />,
      },
    ],
  },
];

export const Default: Story = {
  render: () => (
    <Command
      items={simpleItems}
      onSelect={(key) => console.log('Selected:', key)}
    />
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Command
      groups={groupedCommands}
      onSelect={(key) => console.log('Selected:', key)}
    />
  ),
};

export const CustomPlaceholder: Story = {
  render: () => (
    <Command
      items={simpleItems}
      placeholder="Type a command or search..."
      onSelect={(key) => console.log('Selected:', key)}
    />
  ),
};

export const CustomEmptyText: Story = {
  render: () => (
    <Command
      items={[]}
      emptyText="No commands available. Try searching for something else."
    />
  ),
};

export const WithSearchKeywords: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        Try searching for: "create", "document", "config", "inbox", "schedule"
      </p>
      <Command
        items={simpleItems}
        onSelect={(key) => console.log('Selected:', key)}
      />
    </div>
  ),
};

export const WithCallbacks: Story = {
  render: () => {
    const itemsWithCallbacks: CommandItem[] = simpleItems.map((item) => ({
      ...item,
      onSelect: () => {
        alert(`You selected: ${item.label}`);
      },
    }));

    return (
      <Command
        items={itemsWithCallbacks}
        placeholder="Select a command to see the callback"
      />
    );
  },
};

export const LongList: Story = {
  render: () => {
    const longList: CommandItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      label: `Command ${i + 1}`,
      description: `This is command number ${i + 1}`,
      icon: <FileText className="h-4 w-4" />,
    }));

    return (
      <Command
        items={longList}
        placeholder="Search through 50 commands..."
      />
    );
  },
};

export const InDialog: Story = {
  render: () => (
    <div className="flex h-[600px] w-[800px] items-center justify-center bg-base-300/50 rounded-lg">
      <div className="w-full max-w-lg px-4">
        <Command
          groups={groupedCommands}
          onSelect={(key) => console.log('Selected:', key)}
        />
      </div>
    </div>
  ),
};

