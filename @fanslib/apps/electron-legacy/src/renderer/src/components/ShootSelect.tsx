import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { ShootSummary } from '../../../features/shoots/api-type';
import { useShootContext } from '../contexts/ShootContext';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

type ShootSelectProps = {
  value?: string[];
  onChange: (shootIds: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  omitAllShoots?: boolean;
  placeholder?: string;
};

const ALL_SHOOTS_ID = '__all__';

export const ShootSelect = ({
  value = [],
  onChange,
  multiple = true,
  disabled = false,
  omitAllShoots = false,
  placeholder = 'Select shoot...',
}: ShootSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { shoots } = useShootContext();

  const handleToggleShoot = (shootId: string) => {
    if (disabled) return;

    if (shootId === ALL_SHOOTS_ID) {
      if (value.includes(ALL_SHOOTS_ID)) {
        onChange([]);
      } else {
        onChange([ALL_SHOOTS_ID]);
      }
      return;
    }

    const newValue = value.filter((id) => id !== ALL_SHOOTS_ID);

    if (newValue.includes(shootId)) {
      onChange(newValue.filter((id) => id !== shootId));
      return;
    }

    if (multiple) {
      onChange([...newValue, shootId]);
      return;
    }

    onChange([shootId]);
  };

  const filteredShoots = [
    !omitAllShoots &&
      ({ id: ALL_SHOOTS_ID, name: 'All Shoots' } as ShootSummary),
    ...shoots.filter((shoot) =>
      shoot.name.toLowerCase().includes(search.toLowerCase())
    ),
  ].filter(Boolean);

  const selectedShoots = value.includes(ALL_SHOOTS_ID)
    ? [{ id: ALL_SHOOTS_ID, name: 'All Shoots' } as ShootSummary]
    : shoots.filter((shoot) => value.includes(shoot.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
          disabled={disabled}
        >
          {selectedShoots.length > 0 ? (
            <div className='flex gap-1 flex-wrap'>
              {selectedShoots.map((shoot) => (
                <Badge variant='secondary' key={shoot.id} className='mr-1'>
                  {shoot.name}
                </Badge>
              ))}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full max-h-[400px] overflow-y-auto p-0 pt-9'>
        <Command>
          <div className='fixed top-0 w-full bg-background z-10'>
            <CommandInput
              placeholder={placeholder}
              className='h-9 w-full'
              value={search}
              onValueChange={setSearch}
            />
          </div>
          <CommandList>
            <CommandEmpty>No shoots found.</CommandEmpty>
            {filteredShoots.map((shoot) => (
              <CommandItem
                key={shoot.id}
                onSelect={() => {
                  handleToggleShoot(shoot.id);
                  if (!multiple) {
                    setOpen(false);
                  }
                }}
                className='cursor-pointer'
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value.includes(shoot.id) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {shoot.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
