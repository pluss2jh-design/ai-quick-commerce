import { ProductInfo } from '@/packages/scraper/src/index';

interface ProductCardProps {
  products: ProductInfo[];
  ingredient: string;
}

export default function ProductCard({ products, ingredient }: ProductCardProps) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
        <p className="text-gray-600 dark:text-gray-400">검색 결과가 없습니다.</p>
      </div>
    );
  }

  const lowestPrice = products[0];
  const byPlatform = {
    baemin: products.filter(p => p.platform === 'baemin'),
    coupang: products.filter(p => p.platform === 'coupang'),
    kurly: products.filter(p => p.platform === 'kurly'),
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {ingredient} 상품 비교
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          총 {products.length}개 상품 발견
        </p>
      </div>

      {lowestPrice && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            최저가: {lowestPrice.name}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {lowestPrice.price.toLocaleString()}원
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            {lowestPrice.platform === 'baemin' && '배민'}
            {lowestPrice.platform === 'coupang' && '쿠팡'}
            {lowestPrice.platform === 'kurly' && '마켓컬리'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {byPlatform.baemin.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">배민</h4>
            <div className="space-y-2">
              {byPlatform.baemin.slice(0, 3).map((product, idx) => (
                <a
                  key={idx}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate flex-1">
                    {product.name}
                  </span>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">
                    {product.price.toLocaleString()}원
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {byPlatform.coupang.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">쿠팡</h4>
            <div className="space-y-2">
              {byPlatform.coupang.slice(0, 3).map((product, idx) => (
                <a
                  key={idx}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate flex-1">
                    {product.name}
                  </span>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">
                    {product.price.toLocaleString()}원
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {byPlatform.kurly.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">마켓컬리</h4>
            <div className="space-y-2">
              {byPlatform.kurly.slice(0, 3).map((product, idx) => (
                <a
                  key={idx}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate flex-1">
                    {product.name}
                  </span>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-2">
                    {product.price.toLocaleString()}원
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
