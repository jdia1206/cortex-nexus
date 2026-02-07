import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  extra?: ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionIcon = <Plus className="h-4 w-4" />,
  extra,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 sm:text-base">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        {extra}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2 w-full sm:w-auto">
            {actionIcon}
            <span className="sm:inline">{actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
