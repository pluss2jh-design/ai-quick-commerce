"use client";

import { useState, useEffect } from 'react';
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

  const [cart, setCart] = useState<ProductInfo[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);


  const [availableModels, setAvailableModels] = useState<{ id: string, name: string, provider: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ id: string, provider: string }>({
    id: 'claude-3-haiku-20240307',
    provider: 'anthropic'
  });

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/ai/models');
        const result = await response.json();
        if (result.success) {
          setAvailableModels(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);


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
          modelId: selectedModel.id,
          provider: selectedModel.provider
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

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (product: ProductInfo) => {
    setCart(prev => {
      if (prev.find(p => p.url === product.url)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCart = (url: string) => {
    setCart(prev => prev.filter(p => p.url !== url));
  };

  const [matchingStatus, setMatchingStatus] = useState<string>('');

  const addAllCheapest = async () => {
    if (ingredients.length === 0) return;
    setIsBulkLoading(true);
    setIsCartOpen(true);
    setMatchingStatus('시작하는 중...');

    try {
      setMatchingStatus(`전체 ${ingredients.length}개 재료 매칭 시작...`);

      const matchPromises = ingredients.map(async (ingredient, idx) => {
        try {
          const response = await fetch('/api/products/smart-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ingredient: ingredient.name,
              amount: parseFloat(ingredient.amount),
              unit: ingredient.unit,
              filter: 'price',
            }),
          });

          if (response.ok) {
            const result = await response.json();
            return result.data?.matchedProduct || null;
          }
        } catch (e) {
          console.error(`Error matching ${ingredient.name}:`, e);
        }
        return null;
      });

      const matchedResults = await Promise.all(matchPromises);
      const validResults = matchedResults.filter(Boolean) as ProductInfo[];

      setCart(prev => {
        const existingUrls = new Set(prev.map(p => p.url));
        const filteredNew = validResults.filter(p => !existingUrls.has(p.url));
        return [...prev, ...filteredNew];
      });
      setMatchingStatus(`성공적으로 ${validResults.length}개 상품을 찾았습니다!`);
      setTimeout(() => setMatchingStatus(''), 3000);
    } catch (error) {
      console.error('Bulk add error:', error);
      setMatchingStatus('오류가 발생했습니다.');
    } finally {
      setIsBulkLoading(false);
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
                    <label className="text-sm font-bold text-[#2D2D2D] ml-1">사용할 AI 모델</label>
                    <select
                      value={`${selectedModel.id}|${selectedModel.provider}`}
                      onChange={(e) => {
                        const [id, provider] = e.target.value.split('|');
                        setSelectedModel({ id, provider });
                      }}
                      className="w-full bg-[#FAFAFA] border-2 border-[#F3EFEA] focus:border-[#FF9A8B] rounded-2xl px-6 py-4 text-sm font-medium outline-none transition-all appearance-none cursor-pointer"
                    >
                      {availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <option key={model.id} value={`${model.id}|${model.provider}`}>
                            [{model.provider.toUpperCase()}] {model.name}
                          </option>
                        ))
                      ) : (
                        <option value="claude-3-haiku-20240307|anthropic">Claude 3 Haiku (Loading...)</option>
                      )}
                    </select>
                  </div>

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
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="text-[15px] font-medium text-[#8E8E8E] bg-[#FAFAFA] px-6 py-3 rounded-2xl border border-[#F3EFEA]">
                  총 <span className="text-[#FF9A8B] font-black">{ingredients.length}</span>개의 재료가 발견되었습니다
                </div>
                <button
                  onClick={addAllCheapest}
                  disabled={isBulkLoading}
                  className="w-full md:w-auto px-8 py-3.5 bg-[#2D2D2D] hover:bg-black text-white text-[15px] font-black rounded-2xl shadow-xl shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBulkLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      매칭 중...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      전체 최저가 담기
                    </>
                  )}
                </button>
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
                    <div className="text-[#AEAEAE] font-bold">전체 마켓에서 최저가를 비교하고 있어요</div>
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
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#F3EFEA] hover:border-[#FF9A8B] hover:shadow-md transition-all group"
                                >
                                  <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 min-w-0 flex-1"
                                  >
                                    {product.imageUrl && (
                                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover bg-gray-50" />
                                    )}
                                    <span className="font-bold text-[#2D2D2D] truncate group-hover:text-[#FF9A8B]">{product.name}</span>
                                  </a>
                                  <div className="flex items-center gap-4 ml-4">
                                    <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                                      <span className="font-black text-[#2D2D2D]">
                                        {product.price.toLocaleString()}원
                                      </span>
                                      {product.calories !== undefined && (
                                        <span className="text-[11px] font-bold text-[#FF9A8B]">
                                          {product.calories === 0 ? '저칼로리' : `${product.calories}kcal`}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addToCart(product);
                                      }}
                                      className="p-2.5 bg-[#FFF8F7] text-[#FF9A8B] hover:bg-[#FF9A8B] hover:text-white rounded-xl transition-all border border-[#FF9A8B]/10 active:scale-95"
                                      title="장바구니 담기"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {products.length === 0 && selectedIngredient && !productLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="text-6xl mb-2">🥚</div>
                    <div className="text-xl font-black text-[#2D2D2D]">상품을 찾지 못했어요</div>
                    <p className="text-[#AEAEAE] font-medium">다른 재료를 선택하거나 <br />직접 검색해 보세요.</p>
                  </div>
                )}

                {!selectedIngredient && !productLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="text-6xl mb-2">🔍</div>
                    <div className="text-xl font-black text-[#2D2D2D]">상품 정보를 확인하세요</div>
                    <p className="text-[#AEAEAE] font-medium">왼쪽 리스트에서 재료를 선택하면 <br />각 마켓별 상위 정보를 보여드려요</p>
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

      <button
        onClick={toggleCart}
        className="fixed bottom-10 right-10 w-20 h-20 bg-[#2D2D2D] text-white rounded-[32px] shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-[100]"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cart.length > 0 && (
            <div className="absolute -top-3 -right-3 w-7 h-7 bg-[#FF9A8B] text-white text-[13px] font-black rounded-full flex items-center justify-center border-4 border-[#2D2D2D] animate-bounce">
              {cart.length}
            </div>
          )}
        </div>
      </button>

      {/* Cart Sidebar Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] animate-in fade-in duration-300"
          onClick={toggleCart}
        />
      )}

      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.05)] z-[120] transform transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-[#F3EFEA] flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#2D2D2D]">장바구니</h2>
              <p className="text-sm font-bold text-[#AEAEAE]">선택한 상품들을 확인하세요</p>
            </div>
            <button
              onClick={toggleCart}
              className="w-12 h-12 bg-[#FAFAFA] hover:bg-[#F3EFEA] text-[#AEAEAE] hover:text-[#2D2D2D] rounded-2xl flex items-center justify-center transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
            {isBulkLoading && (
              <div className="bg-[#FFF8F7] border border-[#FF9A8B]/30 p-6 rounded-3xl flex flex-col items-center gap-4 animate-pulse">
                <div className="w-8 h-8 border-4 border-[#FF9A8B]/30 border-t-[#FF9A8B] rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="font-black text-[#FF9A8B] text-sm">최적의 상품을 매칭 중입니다</p>
                  <p className="text-[12px] font-bold text-[#AEAEAE] mt-1">{matchingStatus}</p>
                </div>
              </div>
            )}

            {cart.length === 0 && !isBulkLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="text-6xl">🛒</div>
                <p className="font-bold text-[#AEAEAE]">장바구니가 비어있습니다</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="group relative bg-[#FAFAFA] p-5 rounded-3xl border border-[#F3EFEA] hover:border-[#FF9A8B]/30 transition-all">
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-2xl object-cover bg-white shadow-sm" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[11px] font-black text-[#FF9A8B] uppercase tracking-wider">
                        {item.platform === 'coupang' && 'Coupang'}
                        {item.platform === 'kurly' && 'Kurly'}
                        {item.platform === 'baemin' && 'Baemin B-Mart'}
                      </div>
                      <h4 className="font-bold text-[#2D2D2D] truncate text-[15px]">{item.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-lg text-[#2D2D2D]">{item.price.toLocaleString()}원</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-black text-[#FF9A8B] hover:underline"
                        >
                          상품보기
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.url)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white text-[#AEAEAE] hover:text-[#FF5252] rounded-full shadow-lg border border-[#F3EFEA] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-[#FAFAFA] border-t border-[#F3EFEA] space-y-6">
            <div className="bg-white border border-[#F3EFEA] p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-black text-[#2D2D2D]">✨ 상품 웹 구매 안내</span>
              </div>
              <p className="text-[11px] font-medium text-[#AEAEAE] leading-relaxed">
                웹 버전에서는 팝업 형태로 구매 페이지를 직접 열어줍니다. 팝업 차단이 해제되어 있어야 올바르게 작동하며, 표시된 각 탭에서 수량을 확인 후 장바구니에 담아주시면 됩니다.
              </p>
            </div>

            {cart.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#8E8E8E]">총 주문 금액</span>
                  <span className="text-3xl font-black text-[#2D2D2D]">
                    {cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {['coupang', 'kurly', 'baemin'].map(platform => {
                    const items = cart.filter(p => p.platform === platform);
                    if (items.length === 0) return null;

                    return (
                      <button
                        key={platform}
                        onClick={() => {
                          items.forEach(item => window.open(item.url, '_blank'));
                        }}
                        className={`w-full py-4 text-white text-[15px] font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${platform === 'coupang' ? 'bg-[#0074E9]' :
                          platform === 'kurly' ? 'bg-[#5f0080]' : 'bg-[#2ac1bc]'
                          }`}
                      >
                        <span className="opacity-80">
                          {platform === 'coupang' && '쿠팡'}
                          {platform === 'kurly' && '마켓컬리'}
                          {platform === 'baemin' && '배민B마트'}
                        </span>
                        {items.length}개 상품 장바구니에 담기
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </main>
  );
}
