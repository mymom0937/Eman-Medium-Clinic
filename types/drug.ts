export interface Drug {
  id: string;
  name: string;
  description: string;
  category: DrugCategory;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  manufacturer: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type DrugCategory = 
  | 'antibiotics'
  | 'painkillers'
  | 'vitamins'
  | 'supplements'
  | 'prescription'
  | 'otc'
  | 'other';

export interface DrugFormData {
  name: string;
  description: string;
  category: DrugCategory;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  manufacturer: string;
  expiryDate: string;
  image?: File;
}

export interface DrugSearchParams {
  name?: string;
  category?: DrugCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
} 