import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Crown, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function LogoUpload() {
  const { t } = useTranslation();
  const { profile, tenant } = useAuth();
  const { update } = useTenant();
  const { isPremium } = useSubscription();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = tenant?.logo_url;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.tenant_id) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('logoUpload.invalidType'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('logoUpload.tooLarge'));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${profile.tenant_id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath);

      await update({ logo_url: urlData.publicUrl });
      toast.success(t('logoUpload.uploaded'));
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(t('logoUpload.uploadError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!profile?.tenant_id) return;
    setUploading(true);
    try {
      const { data: files } = await supabase.storage
        .from('tenant-logos')
        .list(profile.tenant_id);

      if (files?.length) {
        const paths = files.map(f => `${profile.tenant_id}/${f.name}`);
        await supabase.storage.from('tenant-logos').remove(paths);
      }

      await update({ logo_url: null });
      toast.success(t('logoUpload.removed'));
    } catch (error) {
      console.error('Logo remove error:', error);
      toast.error(t('logoUpload.removeError'));
    } finally {
      setUploading(false);
    }
  };

  if (!isPremium) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            {t('logoUpload.title')}
            <Badge variant="secondary" className="ml-auto gap-1">
              <Crown className="h-3 w-3" />
              Pro
            </Badge>
          </CardTitle>
          <CardDescription>{t('logoUpload.premiumDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-5 w-5" />
          {t('logoUpload.title')}
        </CardTitle>
        <CardDescription>{t('logoUpload.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative group">
              <div className="h-20 w-20 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? t('common.uploading') : logoUrl ? t('logoUpload.change') : t('logoUpload.upload')}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t('logoUpload.hint')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
