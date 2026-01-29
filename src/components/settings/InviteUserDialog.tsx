import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']),
});

type FormData = z.infer<typeof formSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { logAction } = useAuditLog();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      role: 'user',
    },
  });

  const handleSubmit = async (data: FormData) => {
    if (!profile?.tenant_id) return;

    setIsSubmitting(true);
    try {
      // Create the user using Supabase Auth admin function via edge function
      const { data: result, error } = await supabase.functions.invoke('create-tenant-user', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          tenantId: profile.tenant_id,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      await logAction({
        action: 'create',
        entityType: 'user',
        entityId: result?.userId,
        details: {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        },
      });

      toast.success(t('users.created'));
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.invite')}</DialogTitle>
          <DialogDescription>{t('users.inviteDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.role')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('users.selectRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">{t('users.user')}</SelectItem>
                      <SelectItem value="admin">{t('users.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('users.createUser')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
