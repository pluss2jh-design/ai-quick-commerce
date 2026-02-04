"use client";

import { useState } from 'react';
import type { Ingredient } from '@/packages/shared/src/types';
import type { ProductInfo } from '@/packages/scraper/src/index';

export default function Home() {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [detectedFood, setDetectedFood] = useState<string | null>(null);
  const [isYoutubeInput, setIsYoutubeInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setDetectedFood(null);
    setSelectedIngredient(null);
    setProducts([]);
    try {
      const isYoutube = input.includes('youtube.com') || input.includes('youtu.be');
      setIsYoutubeInput(isYoutube);

      const response = await fetch('/api/ai/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType: isYoutube ? 'youtube' : 'food',
          value: input,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || '분석 실패');
      }

      setTitle(result.data.title);
      setIngredients(result.data.ingredients);

      if (isYoutube && result.data.detectedFood) {
        setDetectedFood(result.data.detectedFood);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const searchProductsForIngredient = async (ingredient: Ingredient) => {
    setProductLoading(true);
    setProductError(null);
    setSelectedIngredient(ingredient.name);

    try {
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient: ingredient.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '상품 검색 실패');
      }

      setProducts(result.data.allProducts);
    } catch (error) {
      console.error('Product search error:', error);
      setProductError(error instanceof Error ? error.message : '상품 검색 중 오류가 발생했습니다.');
    } finally {
      setProductLoading(false);
    }
  };

  const openSmartMatch = async (ingredient: Ingredient, filter: 'price' | 'calorie') => {
    const baseFallbackUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(`${ingredient.name} ${ingredient.amount}${ingredient.unit}`)}&sorter=priceAsc`;

    try {
      setProductLoading(true);
      const response = await fetch('/api/products/smart-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient: ingredient.name,
          amount: parseFloat(ingredient.amount),
          unit: ingredient.unit,
          filter: filter,
        }),
      });

      const result = await response.json();
      let targetUrl = baseFallbackUrl;

      // 스크래핑 성공 시 가장 적합한 상품의 상세 페이지로 바로 이동
      if (response.ok && result.data?.matchedProduct?.url) {
        targetUrl = result.data.matchedProduct.url;
      }

      window.open(targetUrl, '_blank');
    } catch (error) {
      console.error('Smart match failed:', error);
      window.open(baseFallbackUrl, '_blank');
    } finally {
      setProductLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFCFB] text-[#4A4A4A] font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#F3EFEA]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF9A8B] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
              <span className="text-white font-black text-xl">C</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#2D2D2D]">CART.ai</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[15px] font-semibold text-[#6E6E6E]">
            <span className="hover:text-[#FF9A8B] transition-colors cursor-pointer">서비스 소개</span>
            <span className="hover:text-[#FF9A8B] transition-colors cursor-pointer">이용 요금</span>
            <span className="px-6 py-2.5 bg-[#2D2D2D] text-white rounded-full hover:bg-black transition-all cursor-pointer shadow-md">
              시작하기
            </span>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-24 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#FFF0EE] text-[#FF9A8B] rounded-full text-sm font-bold border border-[#FFE4E1]">
                <span className="w-2 h-2 bg-[#FF9A8B] rounded-full animate-pulse"></span>
                <span>AI가 찾아주는 가장 완벽한 한 끼</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black leading-[1.1] tracking-tight text-[#2D2D2D]">
                요리가 <br />
                <span className="text-[#FF9A8B]">놀이</span>가 되는 <br />
                순간
              </h1>

              <p className="text-xl text-[#8E8E8E] max-w-lg leading-relaxed font-medium">
                번거로운 장보기를 AI에게 맡기세요. <br />
                링크만 주시면 모든 재료를 장바구니에 담아드릴게요.
              </p>

              <div className="flex gap-16 pt-4">
                {[
                  { label: "누적 분석", value: "12k+" },
                  { label: "절약 비용", value: "35%" },
                  { label: "파트너사", value: "08" }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-4xl font-black text-[#2D2D2D]">{stat.value}</div>
                    <div className="text-sm font-semibold text-[#AEAEAE] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[500px]">
              <div className="bg-white rounded-[40px] p-10 shadow-[0_32px_64px_-16px_rgba(255,154,139,0.15)] border border-[#F3EFEA] relative">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFD166] rounded-3xl rotate-12 flex items-center justify-center text-4xl shadow-xl">
                  🍳
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-[#2D2D2D] ml-1">레시피 또는 링크</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="김치찌개 또는 유튜브 주소..."
                        className="w-full bg-[#FAFAFA] border-2 border-[#F3EFEA] group-focus-within:border-[#FF9A8B] rounded-2xl px-6 py-5 text-lg font-medium outline-none transition-all placeholder:text-[#CBCBCB]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-16 bg-[#FF9A8B] text-white text-xl font-black rounded-2xl hover:bg-[#FF8A7B] hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50 shadow-lg shadow-orange-100 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "재료 추출하기"
                    )}
                  </button>

                  {errorMessage && (
                    <div className="p-5 bg-[#FFEFEF] border border-[#FFDADA] rounded-2xl text-[#FF6B6B] text-sm font-bold text-center">
                      {errorMessage}
                    </div>
                  )}

                  {detectedFood && isYoutubeInput && (
                    <div className="p-5 bg-[#EEF8FF] border border-[#D6EFFF] rounded-2xl text-[#3E92CC] text-sm font-bold text-center">
                      🤖 분석 결과: <span className="text-[#2D2D2D] ml-1">{detectedFood}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {ingredients.length > 0 && (
        <section className="py-24 px-8 bg-white border-t border-[#F3EFEA]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="space-y-3">
                <div className="text-[#FF9A8B] font-black tracking-widest text-sm">INGREDIENTS LIST</div>
                <h2 className="text-5xl font-black text-[#2D2D2D]">
                  {isYoutubeInput ? title : `${title} 재료`}
                </h2>
              </div>
              <div className="text-[15px] font-medium text-[#8E8E8E] bg-[#FAFAFA] px-6 py-3 rounded-2xl border border-[#F3EFEA]">
                총 <span className="text-[#FF9A8B] font-black">{ingredients.length}</span>개의 재료가 발견되었습니다
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 h-[600px]">
              <div className="overflow-y-auto pr-6 space-y-4 custom-scrollbar">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    onClick={() => searchProductsForIngredient(ingredient)}
                    className={`group p-6 rounded-[28px] border-2 cursor-pointer transition-all ${selectedIngredient === ingredient.name
                      ? 'bg-[#FFF8F7] border-[#FF9A8B] shadow-lg shadow-orange-50'
                      : 'bg-[#FAFAFA] border-[#F3EFEA] hover:border-[#FF9A8B]/30'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-2xl border border-[#F3EFEA] flex items-center justify-center text-lg font-black text-[#FF9A8B] group-hover:bg-[#FF9A8B] group-hover:text-white transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xl font-black text-[#2D2D2D] truncate">{ingredient.name}</div>
                          <div className="text-sm font-bold text-[#AEAEAE]">{ingredient.amount}{ingredient.unit}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openSmartMatch(ingredient, 'price'); }}
                          className="px-4 py-2.5 bg-[#4CAF50] text-white text-[13px] font-black rounded-xl hover:bg-[#43A047] transition-all"
                        >
                          최저가
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openSmartMatch(ingredient, 'calorie'); }}
                          className="px-4 py-2.5 bg-[#FF9A8B] text-white text-[13px] font-black rounded-xl hover:bg-[#FF8A7B] transition-all"
                        >
                          저칼로리
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#FAFAFA] rounded-[40px] border-2 border-[#F3EFEA] p-10 overflow-y-auto custom-scrollbar">
                {productLoading && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-10 h-10 border-4 border-[#FF9A8B]/30 border-t-[#FF9A8B] rounded-full animate-spin"></div>
                    <div className="text-[#AEAEAE] font-bold">최저가 상품을 찾고 있어요</div>
                  </div>
                )}

                {selectedIngredient && !productLoading && products.length > 0 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-[#2D2D2D]">{selectedIngredient}</h3>
                      <span className="text-sm font-bold text-[#FF9A8B] bg-[#FFF0EE] px-4 py-1.5 rounded-full">
                        {products.length}개의 추천 상품
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {['coupang', 'kurly', 'baemin'].map((platform) => {
                        const platformProducts = products.filter(p => p.platform === platform);
                        if (platformProducts.length === 0) return null;

                        return (
                          <div key={platform} className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black text-[#AEAEAE] uppercase tracking-[0.2em]">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF9A8B]"></div>
                              {platform === 'coupang' && '쿠팡'}
                              {platform === 'kurly' && '마켓컬리'}
                              {platform === 'baemin' && '배민B마트'}
                            </div>
                            <div className="space-y-2">
                              {platformProducts.slice(0, 3).map((product, idx) => (
                                <a
                                  key={idx}
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#F3EFEA] hover:border-[#FF9A8B] hover:shadow-md transition-all group"
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    {product.imageUrl && (
                                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover bg-gray-50" />
                                    )}
                                    <span className="font-bold text-[#2D2D2D] truncate group-hover:text-[#FF9A8B]">{product.name}</span>
                                  </div>
                                  <span className="font-black text-[#2D2D2D] ml-4 whitespace-nowrap">
                                    {product.price.toLocaleString()}원
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedIngredient && !productLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="text-6xl mb-2">🔍</div>
                    <div className="text-xl font-black text-[#2D2D2D]">상품을 비교해보세요</div>
                    <p className="text-[#AEAEAE] font-medium">왼쪽 리스트에서 재료를 선택하면 <br />가장 저렴한 상품을 추천해드려요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-32 px-8 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <div className="text-[#FF9A8B] font-black tracking-widest text-sm uppercase">Easy Steps</div>
            <h2 className="text-5xl font-black text-[#2D2D2D]">어떻게 작동하나요?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { emoji: '🔗', title: '링크 입력', desc: '유튜브 영상이나 요리 이름을 입력해주세요.' },
              { emoji: '⚡', title: 'AI 분석', desc: 'AI가 정확한 재료와 분량을 즉시 분석합니다.' },
              { emoji: '🛒', title: '장바구니', desc: '최저가 상품을 확인하고 바로 구매하세요.' },
            ].map((step, i) => (
              <div key={i} className="group bg-white p-12 rounded-[40px] border border-[#F3EFEA] hover:translate-y-[-8px] transition-all shadow-sm hover:shadow-xl hover:shadow-orange-100/30">
                <div className="text-5xl mb-8">{step.emoji}</div>
                <h3 className="text-2xl font-black mb-4 text-[#2D2D2D]">{step.title}</h3>
                <p className="text-[#8E8E8E] font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-16 px-8 bg-white border-t border-[#F3EFEA]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2D2D2D] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="text-xl font-black tracking-tight text-[#2D2D2D]">CART.ai</span>
          </div>
          <div className="flex gap-10 text-sm font-bold text-[#AEAEAE]">
            <span className="hover:text-[#2D2D2D] transition-colors cursor-pointer">이용약관</span>
            <span className="hover:text-[#2D2D2D] transition-colors cursor-pointer">개인정보처리방침</span>
            <span className="hover:text-[#2D2D2D] transition-colors cursor-pointer">이메일문의</span>
          </div>
          <p className="text-sm font-bold text-[#AEAEAE]">© 2026 CART.ai All rights reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@100..900&display=swap');
        
        body {
          font-family: 'Pretendard', sans-serif;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F3EFEA;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FF9A8B;
        }
      `}</style>
    </main>
  );
}
