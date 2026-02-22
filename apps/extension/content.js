
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
    if (request.action === "CHECK_LOGIN") {
        let isLoggedIn = true;
        if (window.location.host.includes('kurly.com')) {
            const loginStr = Array.from(document.querySelectorAll('a')).some(a => a.textContent.trim() === '로그인' || a.href.includes('/member/login'));
            if (loginStr || window.location.pathname.includes('/member/login')) isLoggedIn = false;
        } else if (window.location.host.includes('coupang.com')) {
            const loginLink = document.querySelector('a#login') || window.location.href.includes('login.coupang.com');
            if (loginLink) isLoggedIn = false;
        } else if (window.location.host.includes('baemin.com')) {
            const loginStr = Array.from(document.querySelectorAll('a, button')).some(a => a.textContent.trim() === '로그인');
            if (loginStr || window.location.href.includes('login')) isLoggedIn = false;
        }
        sendResponse({ isLoggedIn });
        return;
    }

    if (request.action === "AUTO_ADD_TO_CART") {
        console.log("[CART.ai] Auto-adding to cart:", request.productName);

        const addToCart = async () => {
            try {
                // Check login first
                let isLoggedIn = true;
                if (window.location.host.includes('kurly.com')) {
                    const loginStr = Array.from(document.querySelectorAll('a')).some(a => a.textContent.trim() === '로그인' || a.href.includes('/member/login'));
                    if (loginStr || window.location.pathname.includes('/member/login')) isLoggedIn = false;
                } else if (window.location.host.includes('coupang.com')) {
                    const loginLink = document.querySelector('a#login') || window.location.href.includes('login.coupang.com');
                    if (loginLink) isLoggedIn = false;
                } else if (window.location.host.includes('baemin.com')) {
                    const loginStr = Array.from(document.querySelectorAll('a, button')).some(a => a.textContent.trim() === '로그인');
                    if (loginStr || window.location.href.includes('login')) isLoggedIn = false;
                }

                if (!isLoggedIn) {
                    sendResponse({ success: false, error: 'NOT_LOGGED_IN', needLogin: true });
                    return;
                }

                // 1. 먼저 수량 선택 (필수)
                console.log("[CART.ai] Step 1: Selecting quantity...");
                await selectQuantity();

                // 2. 장바구니 버튼 클릭
                console.log("[CART.ai] Step 2: Clicking cart button...");
                await clickCartButton(sendResponse);
            } catch (error) {
                console.error("[CART.ai] Error in addToCart:", error);
                sendResponse({ success: false, error: error.message });
            }
        };

        addToCart();
        return true; // 비동기 응답 처리
    }
});

// 수량 선택 함수
async function selectQuantity() {
    console.log("[CART.ai] Selecting quantity...");
    let quantitySelected = false;

    // 방법 1: select 드롭다운 찾기
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
        const wrapper = select.closest('div, dl, dt, dd, label');
        const wrapperText = wrapper ? wrapper.textContent.toLowerCase() : '';

        if (wrapperText.includes('수량') || wrapperText.includes('구매') || wrapperText.includes('qty')) {
            console.log("[CART.ai] Found quantity select");

            if (select.options.length > 1) {
                select.selectedIndex = 1; // 첫 번째 옵션은 보통 "선택하세요"
                select.dispatchEvent(new Event('change', { bubbles: true }));
                console.log("[CART.ai] Quantity selected:", select.options[1].text);
                quantitySelected = true;
                await sleep(800);
                break;
            }
        }
    }

    // 방법 2: input number 필드
    if (!quantitySelected) {
        const qtyInputs = document.querySelectorAll('input[type="number"]');
        for (const input of qtyInputs) {
            const name = input.name.toLowerCase();
            const id = input.id.toLowerCase();
            const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();

            if (name.includes('qty') || name.includes('quantity') || name.includes('수량') ||
                id.includes('qty') || id.includes('quantity') || id.includes('수량')) {
                console.log("[CART.ai] Found quantity input");
                input.value = '1';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                quantitySelected = true;
                await sleep(800);
                break;
            }
        }
    }

    // 방법 3: + 버튼 클릭
    if (!quantitySelected) {
        const plusButtons = document.querySelectorAll('button');
        for (const btn of plusButtons) {
            const text = btn.textContent.trim();
            const ariaLabel = btn.getAttribute('aria-label') || '';

            if ((text === '+' || text === '＋') || ariaLabel.includes('증가')) {
                const parent = btn.closest('div, span');
                if (parent && (parent.textContent.includes('수량') || parent.textContent.includes('구매'))) {
                    console.log("[CART.ai] Clicking plus button for quantity");
                    btn.click();
                    quantitySelected = true;
                    await sleep(800);
                    break;
                }
            }
        }
    }

    if (quantitySelected) {
        console.log("[CART.ai] Quantity selection completed");
    } else {
        console.log("[CART.ai] No quantity selector found, proceeding...");
    }

    return quantitySelected;
}

// 장바구니 버튼 클릭
async function clickCartButton(sendResponse) {
    const maxAttempts = 30;
    let attempts = 0;

    return new Promise((resolve) => {
        const tryClick = () => {
            attempts++;
            console.log(`[CART.ai] Attempt ${attempts}/${maxAttempts} to find cart button`);

            const buttons = Array.from(document.querySelectorAll('button, a'));

            const cartBtn = buttons.find(b => {
                const text = b.innerText.toLowerCase().trim();
                const cls = b.className.toLowerCase();
                const ariaLabel = (b.getAttribute('aria-label') || '').toLowerCase();

                return (
                    (text.includes('장바구니') && (text.includes('담기') || text.includes('추가'))) ||
                    text === '장바구니' ||
                    text.includes('add to cart') ||
                    cls.includes('add-to-cart') ||
                    cls.includes('cart-btn') ||
                    cls.includes('btn_cart') ||
                    ariaLabel.includes('장바구니')
                );
            });

            if (cartBtn) {
                console.log("[CART.ai] Found cart button:", cartBtn.innerText.substring(0, 30));

                if (cartBtn.offsetParent !== null && !cartBtn.disabled) {
                    try {
                        cartBtn.click();
                        console.log("[CART.ai] Successfully clicked cart button");
                        sendResponse({ success: true });
                        resolve(true);
                    } catch (e) {
                        console.error("[CART.ai] Click failed:", e);
                        sendResponse({ success: false, error: e.message });
                        resolve(false);
                    }
                } else {
                    if (attempts < maxAttempts) {
                        setTimeout(tryClick, 500);
                    } else {
                        console.error("[CART.ai] Cart button not clickable after max attempts");
                        sendResponse({ success: false, error: "Cart button not clickable" });
                        resolve(false);
                    }
                }
            } else {
                if (attempts < maxAttempts) {
                    setTimeout(tryClick, 500);
                } else {
                    console.error("[CART.ai] Cart button not found after max attempts");
                    sendResponse({ success: false, error: "Cart button not found" });
                    resolve(false);
                }
            }
        };

        setTimeout(tryClick, 1500);
    });
}

// 유틸리티: sleep 함수
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
