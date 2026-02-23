'use server';

/**
 * Server Actions for Categories
 * Handles all category-related database operations
 */

import { supabase } from '@/lib/supabase/client';
import type {
  Category,
  CategoryInsert,
  CategoryWithChildren,
  CategoryTreeNode,
  ApiResponse,
} from '@/types/database';

/**
 * Get all categories as a flat list
 * @returns Array of all categories
 */
export async function getCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Category[],
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getCategories:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las categorías',
      success: false,
    };
  }
}

/**
 * Get category tree with parent-child relationships
 * Returns categories in a nested structure for UI display
 * @returns Array of parent categories with their children
 */
export async function getCategoryTree(): Promise<ApiResponse<CategoryWithChildren[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching category tree:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    const categories = data as Category[];
    
    // Build the tree structure
    const tree = buildCategoryTree(categories);

    return {
      data: tree,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getCategoryTree:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener el árbol de categorías',
      success: false,
    };
  }
}

/**
 * Build a tree structure from flat category list
 * @param categories - Flat list of categories
 * @returns Nested category tree
 */
function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryWithChildren>();
  
  // Initialize all categories with empty children arrays
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
    });
  });

  // Array to hold root categories (parents)
  const rootCategories: CategoryWithChildren[] = [];

  // Build the tree
  categories.forEach(category => {
    const node = categoryMap.get(category.id)!;
    
    if (category.parent_id === null) {
      // This is a root category
      rootCategories.push(node);
    } else {
      // Add to parent's children
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return rootCategories;
}

/**
 * Get simplified category tree for UI components
 * Returns minimal data needed for dropdowns/selects
 * @returns Array of category tree nodes
 */
export async function getCategoryTreeSimple(): Promise<ApiResponse<CategoryTreeNode[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon_slug, parent_id')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching simple category tree:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Build simplified tree
    const categoryMap = new Map<string, CategoryTreeNode>();
    
    data.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        icon_slug: category.icon_slug,
        children: [],
      });
    });

    const rootCategories: CategoryTreeNode[] = [];

    data.forEach(category => {
      const node = categoryMap.get(category.id)!;
      
      if (category.parent_id === null) {
        rootCategories.push(node);
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return {
      data: rootCategories,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getCategoryTreeSimple:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las categorías',
      success: false,
    };
  }
}

/**
 * Get a single category by ID
 * @param categoryId - The category's ID
 * @returns Single category or error
 */
export async function getCategoryById(
  categoryId: string
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Category,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getCategoryById:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener la categoría',
      success: false,
    };
  }
}

/**
 * Get parent categories only (categories without parent_id)
 * @returns Array of parent categories
 */
export async function getParentCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching parent categories:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Category[],
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getParentCategories:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las categorías padre',
      success: false,
    };
  }
}

/**
 * Get child categories for a specific parent
 * @param parentId - The parent category's ID
 * @returns Array of child categories
 */
export async function getChildCategories(
  parentId: string
): Promise<ApiResponse<Category[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching child categories:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Category[],
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getChildCategories:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las categorías hijas',
      success: false,
    };
  }
}

/**
 * Create a new category (admin only in practice)
 * @param categoryData - The category data to insert
 * @returns Created category or error
 */
export async function createCategory(
  categoryData: CategoryInsert
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Category,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in createCategory:', err);
    return {
      data: null,
      error: 'Error inesperado al crear la categoría',
      success: false,
    };
  }
}

/**
 * Update a category (admin only in practice)
 * @param categoryId - The category's ID
 * @param updates - The fields to update
 * @returns Updated category or error
 */
export async function updateCategory(
  categoryId: string,
  updates: Partial<CategoryInsert>
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Category,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in updateCategory:', err);
    return {
      data: null,
      error: 'Error inesperado al actualizar la categoría',
      success: false,
    };
  }
}

/**
 * Delete a category (only if not system category)
 * @param categoryId - The category's ID
 * @returns Success status
 */
export async function deleteCategory(
  categoryId: string
): Promise<ApiResponse<null>> {
  try {
    // Check if it's a system category
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('is_system')
      .eq('id', categoryId)
      .single();

    if (fetchError || !category) {
      return {
        data: null,
        error: 'Categoría no encontrada',
        success: false,
      };
    }

    if (category.is_system) {
      return {
        data: null,
        error: 'No se pueden eliminar categorías del sistema',
        success: false,
      };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in deleteCategory:', err);
    return {
      data: null,
      error: 'Error inesperado al eliminar la categoría',
      success: false,
    };
  }
}
