import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { SelectWithCreate } from '@/components/shared/SelectWithCreate';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tables } from '@/integrations/supabase/types';
import { useProductCategories } from '@/hooks/useProductCategories';

type Product = Tables<'products'>;

const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  value: z.string(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  category_id: z.string().optional().nullable(),
  image_url: z.string().url().optional().or(z.literal('')),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(100),
  size: z.string().max(50).optional(),
  min_stock: z.coerce.number().min(0).optional(),
  has_serial_tracking: z.boolean().optional(),
  is_active: z.boolean().optional(),
  custom_fields: z.array(customFieldSchema).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  product?: Product | null;
  isLoading?: boolean;
}

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  product,
  isLoading,
}: ProductFormProps) {
  const { t } = useTranslation();
  const { categories } = useProductCategories();
  const isEdit = !!product;

  const parseCustomFields = (fields: unknown): Array<{ name: string; value: string }> => {
    if (Array.isArray(fields)) {
      return fields.filter(
        (f): f is { name: string; value: string } =>
          typeof f === 'object' && f !== null && 'name' in f && 'value' in f
      );
    }
    return [];
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      category_id: product?.category_id || null,
      image_url: (product as any)?.image_url || '',
      cost: product?.cost ? Number(product.cost) : 0,
      price: product?.price ? Number(product.price) : 0,
      quantity: product?.quantity ?? 0,
      tax_rate: product?.tax_rate ? Number(product.tax_rate) : 0,
      size: product?.size || '',
      min_stock: product?.min_stock || 0,
      has_serial_tracking: product?.has_serial_tracking || false,
      is_active: product?.is_active ?? true,
      custom_fields: parseCustomFields(product?.custom_fields),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'custom_fields',
  });

  const handleSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  const addCustomField = () => {
    append({ name: '', value: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('products.edit') : t('products.add')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('products.name')} *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.sku')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.barcode')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.category')}</FormLabel>
                    <FormControl>
                      <SelectWithCreate
                        value={field.value || ''}
                        onValueChange={(value) => field.onChange(value || null)}
                        placeholder={t('products.selectCategory')}
                        items={categories.map(c => ({ id: c.id, name: c.name }))}
                        onCreateNew={async (name) => {
                          const result = await createCategory({ name });
                          return result;
                        }}
                        isCreating={isCreatingCategory}
                        createLabel={t('categories.add')}
                        createPlaceholder={t('categories.namePlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.imageUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.quantity')} *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.cost')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.price')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.taxRate')} (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.size')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.minStock')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('products.description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_serial_tracking"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{t('products.serialTracking')}</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{t('products.active')}</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Fields Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{t('products.customFields')}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomField}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('products.addField')}
                </Button>
              </div>
              
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('products.noCustomFields')}
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`custom_fields.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder={t('products.fieldName')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`custom_fields.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder={t('products.fieldValue')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
