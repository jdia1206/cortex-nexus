import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe, Eye, EyeOff, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

// Password strength validation
const getPasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 25;
  else feedback.push('auth.passwordMinLength');

  if (/[a-z]/.test(password)) score += 25;
  else feedback.push('auth.passwordLowercase');

  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push('auth.passwordUppercase');

  if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) score += 25;
  else feedback.push('auth.passwordNumberOrSpecial');

  return { score, feedback };
};

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // The user should have a session from clicking the reset link
      setIsValidSession(!!session);
      setIsCheckingSession(false);
    };

    checkSession();

    // Listen for auth state changes (when user clicks reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    // Validate password strength (require at least 75% score)
    if (passwordStrength.score < 75) {
      setError(t('auth.passwordTooWeak'));
      return;
    }

    setIsLoading(true);

    try {
      // Update password - this only works for the authenticated user's own session
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      // Sign out immediately after password change for security
      // This invalidates the recovery session and requires fresh login
      await supabase.auth.signOut();

      setIsSuccess(true);
      setIsLoading(false);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(t('auth.resetPasswordError'));
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidSession && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.invalidResetLink')}</CardTitle>
            <CardDescription>{t('auth.invalidResetLinkDescription')}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/forgot-password">
              <Button>{t('auth.requestNewLink')}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl">{t('auth.resetPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.resetPasswordSubtitle')}</CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">{t('auth.passwordResetSuccess')}</p>
                <p className="text-sm text-muted-foreground">{t('auth.redirectingToLogin')}</p>
              </div>
            </div>
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
                <Label htmlFor="password">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <Progress 
                      value={passwordStrength.score} 
                      className={`h-2 ${
                        passwordStrength.score < 50 ? '[&>div]:bg-destructive' : 
                        passwordStrength.score < 75 ? '[&>div]:bg-yellow-500' : 
                        '[&>div]:bg-green-500'
                      }`}
                    />
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {passwordStrength.feedback.map((key) => (
                          <li key={key} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t(key)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.resetPassword')}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
