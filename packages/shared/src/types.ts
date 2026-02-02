export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id?: string;
  title: string;
  youtubeUrl?: string;
  dishName?: string;
  ingredients: Ingredient[];
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  platform: 'baemin' | 'coupang' | 'kurly';
  url: string;
  calories?: number;
  imageUrl?: string;
}

export interface SearchRequest {
  type: 'youtube' | 'dish';
  query: string;
}

export interface SearchResult {
  recipe: Recipe;
  products: Product[];
}

export type Platform = 'baemin' | 'coupang' | 'kurly';

export interface User {
  id: string;
  email: string;
  name?: string;
}
