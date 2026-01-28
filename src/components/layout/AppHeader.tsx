import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Globe, LogOut, User, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { CurrencySwitcher } from '@/components/shared/CurrencySwitcher';

interface AppHeaderProps {
  companyName?: string;
  userName?: string;
  onLogout?: () => void;
}

export function AppHeader({ companyName, userName, onLogout }: AppHeaderProps) {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
        {companyName && (
          <div className="hidden sm:block min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate lg:text-lg">{companyName}</h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Currency Switcher - Hidden on small mobile */}
        <div className="hidden xs:block">
          <CurrencySwitcher />
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-9 sm:w-9">
          {isDark ? (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          )}
        </Button>

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
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

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <span className="hidden md:inline-block text-foreground text-sm">
                {userName || t('auth.login')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
