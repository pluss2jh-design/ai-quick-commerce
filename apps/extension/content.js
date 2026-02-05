
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
    if (request.action === "PING") {
        sendResponse({ status: "pong" });
        return;
    }

    if (request.action === "AUTO_ADD_TO_CART") {
        console.log("[CART.ai] Auto-adding to cart:", request.productName);

        // 페이지 로드 대기 후 버튼 클릭 시도
        // 페이지 로드 대기 후 버튼 클릭 시도
        const waitForButton = async () => {
            const maxAttempts = 20; // 2초 간격 20회 = 40초 (넉넉하게)
            let attempts = 0;

            const checkButton = () => {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                // 더 다양한 셀렉터와 텍스트 매칭
                const cartBtn = buttons.find(b => {
                    const text = b.innerText.toLowerCase();
                    const cls = b.className.toLowerCase();
                    return (
                        (text.includes('장바구니') && text.includes('담기')) ||
                        text.includes('add to cart') ||
                        cls.includes('add-to-cart') ||
                        cls.includes('cart-btn') ||
                        (b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('장바구니'))
                    );
                });

                if (cartBtn) {
                    // 버튼이 보이고 클릭 가능한지 확인 (간단한 체크)
                    if (cartBtn.offsetParent !== null && !cartBtn.disabled) {
                        try {
                            cartBtn.click();
                            console.log("[CART.ai] Clicked add to cart:", request.productName);
                            sendResponse({ success: true });
                        } catch (e) {
                            console.error("[CART.ai] Click failed:", e);
                            sendResponse({ success: false, error: e.message });
                        }
                    } else {
                        // 버튼은 찾았으나 숨겨져 있거나 비활성 상태
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(checkButton, 500);
                        } else {
                            console.error("[CART.ai] Cart button found but not clickable");
                            sendResponse({ success: false, error: "Cart button not clickable" });
                        }
                    }
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkButton, 500);
                    } else {
                        console.error("[CART.ai] Cart button not found after retries");
                        sendResponse({ success: false, error: "Cart button not found" });
                    }
                }
            };

            // 약간의 초기 지연 (페이지 초기화 대기)
            setTimeout(checkButton, 1000);
        };

        waitForButton();

        return true; // 비동기 응답 처리
    }
});
