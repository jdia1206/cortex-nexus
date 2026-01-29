import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ReturnStatus = 'pending' | 'approved' | 'rejected';

interface ReturnStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  currentReason: string | null;
  onSubmit: (status: string, reason?: string) => Promise<void>;
  isSubmitting: boolean;
}

const STATUS_OPTIONS: { value: ReturnStatus; labelKey: string }[] = [
  { value: 'pending', labelKey: 'returns.statusPending' },
  { value: 'approved', labelKey: 'returns.statusProcessed' },
  { value: 'rejected', labelKey: 'returns.statusNotProcessed' },
];

export function ReturnStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  currentReason,
  onSubmit,
  isSubmitting,
}: ReturnStatusDialogProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(currentStatus);
  const [reason, setReason] = useState(currentReason || '');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    
    // Validate reason is required for "not processed" (rejected)
    if (status === 'rejected' && !reason.trim()) {
      setError(t('returns.reasonRequired'));
      return;
    }

    await onSubmit(status, status === 'rejected' ? reason.trim() : undefined);
    onOpenChange(false);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('returns.changeStatus')}</DialogTitle>
          <DialogDescription>
            {t('returns.changeStatusDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('returns.status')}</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'rejected' && (
            <div className="space-y-2">
              <Label>
                {t('returns.reason')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder={t('returns.notProcessedReasonPlaceholder')}
                rows={3}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
