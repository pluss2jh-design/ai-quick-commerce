// 진행 중인 장바구니 작업 상태 저장
let cartOperationState = {
    platform: null,
    products: [],
    currentIndex: 0,
    tabId: null,
    isWaitingForLogin: false
};

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // 웹사이트(localhost:3000)에서 보낸 메시지 수신
    if (request.action === "PING") {
        sendResponse({ status: "pong" });
        return;
    }

    if (request.action === "START_MARKET_SYNC") {
        const { products } = request;
        console.log("[CART.ai] Received sync request for items:", products.length);

        // 플랫폼별로 그룹화
        const grouped = {};
        products.forEach(p => {
            if (!grouped[p.platform]) grouped[p.platform] = [];
            grouped[p.platform].push(p);
        });

        // 마켓컬리 상품이 있으면 특별 처리
        if (grouped['kurly'] && grouped['kurly'].length > 0) {
            startKurlyCartOperation(grouped['kurly']);
            sendResponse({ status: "started", message: "Kurly cart operation started" });
        } else {
            // 다른 플랫폼은 기존 방식대로 처리
            processItems(products);
            sendResponse({ status: "started" });
        }
    }
});

// 마켓컬리 장바구니 작업 시작
function startKurlyCartOperation(products) {
    console.log("[CART.ai] Starting Kurly cart operation for:", products);

    cartOperationState = {
        platform: 'kurly',
        products: products,
        currentIndex: 0,
        tabId: null,
        isWaitingForLogin: true
    };

    // 마켓컬리 로그인 페이지 열기
    chrome.tabs.create({
        url: 'https://www.kurly.com/member/login',
        active: true
    }, (tab) => {
        cartOperationState.tabId = tab.id;
        console.log("[CART.ai] Opened Kurly login page, tab:", tab.id);

        // 로그인 완료를 주기적으로 확인
        checkKurlyLoginStatus(tab.id);
    });
}

// 마켓컬리 로그인 상태 확인
function checkKurlyLoginStatus(tabId) {
    const checkInterval = setInterval(() => {
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                console.log("[CART.ai] Tab closed, stopping login check");
                clearInterval(checkInterval);
                return;
            }

            // URL이 로그인 페이지가 아니면 로그인 완료로 간주
            if (!tab.url.includes('/member/login')) {
                console.log("[CART.ai] Login detected! Starting cart operations...");
                clearInterval(checkInterval);
                cartOperationState.isWaitingForLogin = false;

                // 로그인 완료 후 장바구니 담기 시작
                setTimeout(() => addNextProductToCart(), 2000);
            }
        });
    }, 1000); // 1초마다 확인

    // 5분 후 타임아웃
    setTimeout(() => {
        clearInterval(checkInterval);
        if (cartOperationState.isWaitingForLogin) {
            console.log("[CART.ai] Login timeout");
        }
    }, 300000);
}

// 다음 상품을 장바구니에 담기
function addNextProductToCart() {
    if (cartOperationState.currentIndex >= cartOperationState.products.length) {
        console.log("[CART.ai] All products added to cart!");

        // 장바구니 페이지로 이동
        chrome.tabs.update(cartOperationState.tabId, {
            url: 'https://www.kurly.com/cart'
        });

        return;
    }

    const product = cartOperationState.products[cartOperationState.currentIndex];
    console.log(`[CART.ai] Adding product ${cartOperationState.currentIndex + 1}/${cartOperationState.products.length}:`, product.name);

    // 상품의 재료 이름으로 검색
    const ingredientName = extractIngredientName(product.name);
    const searchUrl = `https://www.kurly.com/search?sword=${encodeURIComponent(ingredientName)}`;

    chrome.tabs.update(cartOperationState.tabId, { url: searchUrl }, () => {
        // 페이지 로딩 대기 후 content script에 장바구니 담기 명령 전송
        setTimeout(() => {
            chrome.tabs.sendMessage(cartOperationState.tabId, {
                action: "AUTO_ADD_TO_CART",
                productName: ingredientName
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[CART.ai] Failed to send message to content script:", chrome.runtime.lastError);
                }

                console.log("[CART.ai] Product added, moving to next...");
                cartOperationState.currentIndex++;

                // 다음 상품으로 이동 (2초 대기)
                setTimeout(() => addNextProductToCart(), 2000);
            });
        }, 3000); // 페이지 로딩을 위한 대기 시간
    });
}

// 상품명에서 재료 이름 추출 (괄호 및 수량 정보 제거)
function extractIngredientName(productName) {
    return productName
        .replace(/\([^)]*\)/g, '') // 괄호 제거
        .replace(/\d+\s*(g|kg|ml|l|개|팩|입)/gi, '') // 수량 정보 제거
        .trim()
        .split(' ')[0]; // 첫 단어만 사용
}

// Content script로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CART_ADD_COMPLETE') {
        console.log("[CART.ai] Cart add confirmed from content script");
        sendResponse({ success: true });
    }
    return true;
});

async function processItems(products) {
    for (const product of products) {
        try {
            // 탭 생성
            const tab = await chrome.tabs.create({ url: product.url, active: false });

            // 페이지 로드 완료 대기 및 컨텐츠 스크립트에 명령 전송
            await new Promise(resolve => setTimeout(resolve, 5000));

            chrome.tabs.sendMessage(tab.id, {
                action: "AUTO_ADD_TO_CART",
                productName: product.name
            }, (response) => {
                console.log(`[CART.ai] Result for ${product.name}:`, response);
                // 담기 성공 후 탭 닫기 (사용자 편의)
                if (response && response.success) {
                    // chrome.tabs.remove(tab.id); 
                }
            });
        } catch (err) {
            console.error("[CART.ai] Error processing item:", err);
        }
    }
}
