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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
