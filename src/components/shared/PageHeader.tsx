import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionIcon = <Plus className="h-4 w-4" />
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 sm:text-base">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2 w-full sm:w-auto shrink-0">
          {actionIcon}
          <span className="sm:inline">{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}
