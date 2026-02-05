
// 마켓별 장바구니 담기 버튼 셀렉터 정보
const MARKET_CONFIG = {
    coupang: {
        cartButton: '.prod-buy-btn, .add-to-cart',
        successIndicator: '.cart-toast'
    },
    kurly: {
        cartButton: 'button:has-text("장바구니 담기"), .btn_type1 .txt_type',
        successIndicator: '.toast_message'
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "AUTO_ADD_TO_CART") {
        console.log("[CART.ai] Auto-adding to cart:", request.productName);

        // 페이지 로드 대기 후 버튼 클릭 시도
        setTimeout(() => {
            // 마켓별 버튼 찾기 (플랫폼 특성에 맞춰 지속 업데이트 필요)
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const cartBtn = buttons.find(b =>
                b.innerText.includes('장바구니 담기') ||
                b.innerText.includes('Add to Cart') ||
                b.className.includes('buy-btn')
            );

            if (cartBtn) {
                cartBtn.click();
                console.log("[CART.ai] Clicked add to cart!");
                sendResponse({ success: true });
            } else {
                console.error("[CART.ai] Cart button not found");
                sendResponse({ success: false, error: "Cart button not found" });
            }
        }, 2000); // 페이지 렌더링 대기

        return true; // 비동기 응답 처리
    }
});
