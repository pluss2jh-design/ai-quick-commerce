
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // 웹사이트(localhost:3000)에서 보낸 메시지 수신
    if (request.action === "START_MARKET_SYNC") {
        const { products } = request;
        console.log("[CART.ai] Received sync request for items:", products.length);

        // 순차적으로 탭을 열고 담기 액션 수행
        processItems(products);
        sendResponse({ status: "started" });
    }
});

async function processItems(products) {
    for (const product of products) {
        try {
            // 탭 생성
            const tab = await chrome.tabs.create({ url: product.url, active: false });

            // 페이지 로드 완료 대기 및 컨텐츠 스크립트에 명령 전송
            // (현실적으로는 좀 더 복잡한 대기 로직이 필요하지만 우선 기본 구조 구현)
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
