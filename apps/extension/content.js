console.log("[CART.ai Content Script] Loaded on:", window.location.href);

// Background script로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[CART.ai Content Script] Received message:", request);

    if (request.action === "AUTO_ADD_TO_CART") {
        const productName = request.productName;
        console.log("[CART.ai Content Script] Attempting to add to cart:", productName);

        // 현재 어느 사이트인지 확인
        const hostname = window.location.hostname;

        if (hostname.includes('kurly.com')) {
            handleKurlyAddToCart(productName, sendResponse);
            return true; // 비동기 응답을 위해 true 반환
        } else if (hostname.includes('coupang.com')) {
            handleCoupangAddToCart(productName, sendResponse);
            return true;
        } else if (hostname.includes('baemin.com')) {
            handleBaeminAddToCart(productName, sendResponse);
            return true;
        } else {
            sendResponse({ success: false, message: "Unsupported platform" });
        }
    }
});

// 마켓컬리 장바구니 담기 처리
function handleKurlyAddToCart(productName, sendResponse) {
    try {
        // 검색 결과 페이지라면 첫 번째 상품 클릭
        if (window.location.href.includes('/search')) {
            console.log("[CART.ai] On search page, finding first product...");

            // 상품 클릭 (여러 선택자 시도)
            const productSelectors = [
                '[data-testid="product-item"] a',
                '[class*="ProductItem"] a',
                'a[href*="/goods/"]',
                '.product-link',
                'a:has(img[alt*="' + productName + '"])'
            ];

            let productClicked = false;
            for (const selector of productSelectors) {
                const productLink = document.querySelector(selector);
                if (productLink) {
                    console.log("[CART.ai] Found product with selector:", selector);
                    productLink.click();
                    productClicked = true;
                    break;
                }
            }

            if (!productClicked) {
                console.error("[CART.ai] Could not find product to click");
                sendResponse({ success: false, message: "Product not found on search page" });
                return;
            }

            // 페이지 이동 대기 후 다시 시도
            setTimeout(() => {
                findAndClickCartButton(sendResponse);
            }, 3000);
        } else {
            // 상품 상세 페이지라면 바로 장바구니 버튼 클릭
            findAndClickCartButton(sendResponse);
        }
    } catch (error) {
        console.error("[CART.ai] Error in handleKurlyAddToCart:", error);
        sendResponse({ success: false, message: error.message });
    }
}

// 장바구니 버튼 찾아서 클릭
function findAndClickCartButton(sendResponse) {
    const cartButtonSelectors = [
        'button:has-text("장바구니")',
        'button:has-text("담기")',
        'button[class*="cart"]',
        'button[class*="Cart"]',
        '[data-testid="cart-button"]',
        'button[type="button"]:has-text("장바구니")',
        'button:contains("장바구니")'
    ];

    let buttonClicked = false;
    for (const selector of cartButtonSelectors) {
        try {
            // :has-text와 :contains는 표준 선택자가 아니므로 수동으로 찾기
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
                const buttonText = button.textContent.trim();
                if (buttonText.includes('장바구니') || buttonText.includes('담기')) {
                    console.log("[CART.ai] Found cart button:", buttonText);
                    button.click();
                    buttonClicked = true;

                    // 팝업 닫기 버튼 찾아서 클릭 (계속 쇼핑 등)
                    setTimeout(() => {
                        const continueButtons = document.querySelectorAll('button');
                        for (const btn of continueButtons) {
                            const text = btn.textContent.trim();
                            if (text.includes('계속') || text.includes('쇼핑') || text.includes('닫기')) {
                                btn.click();
                                break;
                            }
                        }
                    }, 1000);

                    break;
                }
            }
            if (buttonClicked) break;
        } catch (e) {
            console.error("[CART.ai] Error trying selector:", selector, e);
        }
    }

    if (buttonClicked) {
        console.log("[CART.ai] Successfully clicked cart button");
        sendResponse({ success: true, message: "Added to cart" });

        // Background script에 완료 알림
        chrome.runtime.sendMessage({ action: 'CART_ADD_COMPLETE' });
    } else {
        console.error("[CART.ai] Could not find cart button");
        sendResponse({ success: false, message: "Cart button not found" });
    }
}

// 쿠팡 장바구니 담기 처리 (필요시 구현)
function handleCoupangAddToCart(productName, sendResponse) {
    console.log("[CART.ai] Coupang add to cart not implemented yet");
    sendResponse({ success: false, message: "Coupang not implemented" });
}

// 배민 장바구니 담기 처리 (필요시 구현)
function handleBaeminAddToCart(productName, sendResponse) {
    console.log("[CART.ai] Baemin add to cart not implemented yet");
    sendResponse({ success: false, message: "Baemin not implemented" });
}
