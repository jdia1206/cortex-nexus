import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface SelectWithCreateProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: { id: string; name: string }[];
  onCreateNew: (name: string) => Promise<any>;
  isCreating?: boolean;
  createLabel?: string;
  createPlaceholder?: string;
}

export function SelectWithCreate({
  value,
  onValueChange,
  placeholder,
  items,
  onCreateNew,
  isCreating,
  createLabel,
  createPlaceholder,
}: SelectWithCreateProps) {
  const { t } = useTranslation();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await onCreateNew(newName.trim());
    if (result?.id) {
      onValueChange(result.id);
    }
    setNewName('');
    setShowCreate(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      setShowCreate(false);
      setNewName('');
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
        {items.length > 0 && <Separator className="my-1" />}
        {showCreate ? (
          <div className="px-2 py-1.5 flex gap-1.5" onKeyDown={handleKeyDown}>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={createPlaceholder || t('common.name')}
              className="h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="sm"
              className="h-8 px-2 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreate();
              }}
              disabled={isCreating || !newName.trim()}
            >
              {isCreating ? '...' : t('common.save')}
            </Button>
          </div>
        ) : (
          <button
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createLabel || t('common.createNew')}
          </button>
        )}
      </SelectContent>
    </Select>
  );
}
