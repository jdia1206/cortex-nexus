import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCurrency, CURRENCIES } from '@/contexts/CurrencyContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function CurrencySwitcher() {
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] justify-between"
        >
          <span className="flex items-center gap-2">
            <span className="font-mono">{currency.symbol}</span>
            <span>{currency.code}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={t('common.search')} />
          <CommandList>
            <CommandEmpty>{t('common.noData')}</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((curr) => (
                <CommandItem
                  key={curr.code}
                  value={curr.code}
                  onSelect={() => {
                    setCurrency(curr);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currency.code === curr.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-mono mr-2">{curr.symbol}</span>
                  <span>{curr.code}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{curr.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
