// src/services/categoryService.ts
import { Category } from '../models';

export const categoryService = {
  async createCategory(tenantId: string, data: {
    name: string;
    slug: string;
    description?: string;
    isActive?: boolean;
  }) {
    const existing = await Category.findOne({ tenant: tenantId, slug: data.slug.toLowerCase() });
    if (existing) throw new Error('Category slug already exists');

    return Category.create({
      tenant: tenantId,
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description,
      isActive: data.isActive ?? true,
    });
  },

  async listCategories(tenantId: string) {
    return Category.find({ tenant: tenantId }).sort({ name: 1 });
  },

  async updateCategory(tenantId: string, id: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
  }>) {
    const update: any = { ...data };
    if (data.slug) update.slug = data.slug.toLowerCase();

    return Category.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      update,
      { new: true },
    );
  },
};
