import React from 'react';

interface Ingredient {
    name: string;
    amount: string;
    unit: string;
}

interface IngredientListCardProps {
    ingredients: Ingredient[];
    onIngredientClick?: (ingredient: Ingredient) => void;
    selectedIngredient?: string | null;
}

const IngredientListCard = ({ ingredients, onIngredientClick, selectedIngredient }: IngredientListCardProps) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">재료 리스트</h2>
            <div className="space-y-3">
                {ingredients.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">요리명을 입력하면 재료가 자동으로 추출됩니다.</p>
                ) : (
                    ingredients.map((item, index) => (
                        <div 
                            key={index} 
                            onClick={() => onIngredientClick && onIngredientClick(item)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                                onIngredientClick ? 'hover:bg-orange-50' : ''
                            } ${
                                selectedIngredient === item.name 
                                    ? 'bg-orange-50 border-2 border-orange-200' 
                                    : 'bg-gray-50'
                            }`}
                        >
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-sm text-gray-500">{item.amount}{item.unit}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default IngredientListCard;