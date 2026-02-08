import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Fetches the tenant logo as a base64 data URL for use in jsPDF.
 * Returns null if no logo is set or loading fails.
 */
export function useLogoDataUrl() {
  const { tenant } = useAuth();
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.logo_url) {
      setLogoDataUrl(null);
      return;
    }

    let cancelled = false;

    const loadLogo = async () => {
      try {
        const response = await fetch(tenant.logo_url!);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) {
            setLogoDataUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) setLogoDataUrl(null);
      }
    };

    loadLogo();
    return () => { cancelled = true; };
  }, [tenant?.logo_url]);

  return logoDataUrl;
}
