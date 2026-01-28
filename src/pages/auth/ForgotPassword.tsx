import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(t('auth.resetError'));
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Language Switcher */}
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={currentLanguage === lang.code ? 'bg-accent' : ''}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-primary">{t('common.appName')}</h1>
          </div>
          <CardTitle className="text-2xl">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.forgotPasswordSubtitle')}</CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">{t('auth.resetEmailSent')}</p>
                <p className="text-sm text-muted-foreground">{t('auth.resetEmailSentDescription')}</p>
              </div>
            </div>
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.backToLogin')}
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.sendResetLink')}
              </Button>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                {t('auth.backToLogin')}
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
