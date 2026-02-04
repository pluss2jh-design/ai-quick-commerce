import { Ingredient } from '@/packages/shared/src/types';

interface FoodInputCardProps {
  foodName: string;
  onFoodNameChange: (value: string) => void;
}

export default function FoodInputCard({ foodName, onFoodNameChange }: FoodInputCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
      <div className="mb-4">
        <label 
          htmlFor="food-name" 
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Food Name
        </label>
        <input
          id="food-name"
          type="text"
          value={foodName}
          onChange={(e) => onFoodNameChange(e.target.value)}
          placeholder="Enter food name (e.g., Kimchi Stew)"
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}