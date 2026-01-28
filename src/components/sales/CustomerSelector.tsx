import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Building2, User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export function CustomerSelector({ customers, selectedCustomer, onSelect }: CustomerSelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const search = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search) ||
        customer.tax_id?.toLowerCase().includes(search)
    );
  }, [customers, searchTerm]);

  if (selectedCustomer) {
    return (
      <div className="border rounded-lg p-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedCustomer.customer_type === 'company' ? (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm">{selectedCustomer.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedCustomer.email || selectedCustomer.phone || t('customers.noContact')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('sales.searchCustomers')}
          className="pl-9"
        />
      </div>
      
      <ScrollArea className="h-[180px] border rounded-lg">
        {filteredCustomers.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('sales.noCustomersFound')}
          </div>
        ) : (
          <div className="p-1">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelect(customer)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
              >
                {customer.customer_type === 'company' ? (
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.email || customer.phone || '-'}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {t(`customers.${customer.customer_type}`)}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
