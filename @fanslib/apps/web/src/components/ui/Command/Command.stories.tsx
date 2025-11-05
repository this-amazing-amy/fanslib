import type { Meta, StoryObj } from '@storybook/react';
import {
  FileText,
  Settings,
  User,
  Mail,
  Calendar,
  Folder,
  Plus,
  Edit,
  Trash,
} from 'lucide-react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from './Command';

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

export const Default: Story = {
  render: () => (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandGroup>
        <CommandItem value="new file" onSelect={() => console.log('New File selected')}>
          <FileText className="h-4 w-4 mr-2" />
          New File
        </CommandItem>
        <CommandItem value="settings" onSelect={() => console.log('Settings selected')}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </CommandItem>
        <CommandItem value="profile" onSelect={() => console.log('Profile selected')}>
          <User className="h-4 w-4 mr-2" />
          Profile
        </CommandItem>
        <CommandItem value="mail" onSelect={() => console.log('Mail selected')}>
          <Mail className="h-4 w-4 mr-2" />
          Mail
        </CommandItem>
        <CommandItem value="calendar" onSelect={() => console.log('Calendar selected')}>
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </CommandItem>
      </CommandGroup>
      <CommandEmpty>No results found.</CommandEmpty>
    </Command>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Command>
      <CommandInput placeholder="Search commands..." />
      <CommandGroup heading="Files">
        <CommandItem value="new file">
          <Plus className="h-4 w-4 mr-2" />
          New File
        </CommandItem>
        <CommandItem value="open file">
          <Folder className="h-4 w-4 mr-2" />
          Open File
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading="Edit">
        <CommandItem value="edit">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </CommandItem>
        <CommandItem value="delete">
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading="Settings">
        <CommandItem value="preferences">
          <Settings className="h-4 w-4 mr-2" />
          Preferences
        </CommandItem>
        <CommandItem value="profile">
          <User className="h-4 w-4 mr-2" />
          Profile
        </CommandItem>
      </CommandGroup>
      <CommandEmpty>No results found.</CommandEmpty>
    </Command>
  ),
};

export const CustomPlaceholder: Story = {
  render: () => (
    <Command>
      <CommandInput placeholder="Type a command or search..." />
      <CommandGroup>
        <CommandItem value="new file">
          <FileText className="h-4 w-4 mr-2" />
          New File
        </CommandItem>
        <CommandItem value="settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </CommandItem>
      </CommandGroup>
      <CommandEmpty>No results found.</CommandEmpty>
    </Command>
  ),
};

export const CustomEmptyText: Story = {
  render: () => (
    <Command>
      <CommandInput />
      <CommandEmpty>No commands available. Try searching for something else.</CommandEmpty>
    </Command>
  ),
};

export const WithSearchKeywords: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        Try searching for: &quot;create&quot;, &quot;document&quot;, &quot;config&quot;, &quot;inbox&quot;, &quot;schedule&quot;
      </p>
      <Command>
        <CommandInput />
        <CommandGroup>
          <CommandItem value="new file create document">
            <FileText className="h-4 w-4 mr-2" />
            New File
          </CommandItem>
          <CommandItem value="settings preferences config">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </CommandItem>
          <CommandItem value="profile account user">
            <User className="h-4 w-4 mr-2" />
            Profile
          </CommandItem>
          <CommandItem value="mail email inbox">
            <Mail className="h-4 w-4 mr-2" />
            Mail
          </CommandItem>
          <CommandItem value="calendar schedule events">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </CommandItem>
        </CommandGroup>
        <CommandEmpty>No results found.</CommandEmpty>
      </Command>
    </div>
  ),
};

export const WithCallbacks: Story = {
  render: () => (
    <Command>
      <CommandInput placeholder="Select a command to see the callback" />
      <CommandGroup>
        <CommandItem
          value="new file"
          onSelect={() => {
            alert('You selected: New File');
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          New File
        </CommandItem>
        <CommandItem
          value="settings"
          onSelect={() => {
            alert('You selected: Settings');
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </CommandItem>
        <CommandItem
          value="profile"
          onSelect={() => {
            alert('You selected: Profile');
          }}
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </CommandItem>
      </CommandGroup>
      <CommandEmpty>No results found.</CommandEmpty>
    </Command>
  ),
};

export const LongList: Story = {
  render: () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      label: `Command ${i + 1}`,
      description: `This is command number ${i + 1}`,
    }));

    return (
      <Command>
        <CommandInput placeholder="Search through 50 commands..." />
        <CommandGroup>
          {items.map((item) => (
            <CommandItem key={item.id} value={item.label}>
              <FileText className="h-4 w-4 mr-2" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandEmpty>No results found.</CommandEmpty>
      </Command>
    );
  },
};

export const InDialog: Story = {
  render: () => (
    <div className="flex h-[600px] w-[800px] items-center justify-center bg-base-300/50 rounded-lg">
      <div className="w-full max-w-lg px-4">
        <Command>
          <CommandInput />
          <CommandGroup heading="Files">
            <CommandItem value="new file">
              <Plus className="h-4 w-4 mr-2" />
              New File
            </CommandItem>
            <CommandItem value="open file">
              <Folder className="h-4 w-4 mr-2" />
              Open File
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Edit">
            <CommandItem value="edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </CommandItem>
            <CommandItem value="delete">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Settings">
            <CommandItem value="preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </CommandItem>
            <CommandItem value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </CommandItem>
          </CommandGroup>
          <CommandEmpty>No results found.</CommandEmpty>
        </Command>
      </div>
    </div>
  ),
};
