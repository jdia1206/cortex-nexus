import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProductCategories, ProductCategory } from '@/hooks/useProductCategories';
import { CategoryForm } from './CategoryForm';
import { DeleteDialog } from '@/components/shared';

export function CategoryManager() {
  const { t } = useTranslation();
  const { categories, isLoading, create, update, delete: deleteCategory, isCreating, isUpdating, isDeleting } = useProductCategories();
  
  const [managerOpen, setManagerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: ProductCategory) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const handleSubmit = async (data: { name: string; description?: string }) => {
    if (selectedCategory) {
      await update({ id: selectedCategory.id, ...data });
    } else {
      await create(data);
    }
    setSelectedCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      await deleteCategory(selectedCategory.id);
      setDeleteOpen(false);
      setSelectedCategory(null);
    }
  };

  return (
    <>
      <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderTree className="h-4 w-4 mr-2" />
            {t('categories.manage')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('categories.title')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('categories.add')}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('categories.empty')}</p>
                <p className="text-sm">{t('categories.emptyDescription')}</p>
              </div>
            ) : (
              <div className="divide-y rounded-md border">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        category={selectedCategory}
        isLoading={isCreating || isUpdating}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
