
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // 웹사이트(localhost:3000)에서 보낸 메시지 수신
    if (request.action === "PING") {
        sendResponse({ status: "pong" });
        return;
    }

    if (request.action === "START_MARKET_SYNC") {
        const { products } = request;
        console.log("[CART.ai] Received sync request for items:", products.length);

        // 순차적으로 탭을 열고 담기 액션 수행
        processItems(products, sender.tab?.id);
        sendResponse({ status: "started" });
    }
});

async function processItems(products, senderTabId) {
    const results = [];
    let processingTabId = null;

    try {
        // 첫 번째 탭 생성 (비활성 상태)
        const tab = await chrome.tabs.create({ url: 'about:blank', active: false });
        processingTabId = tab.id;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            let attempts = 0;
            let success = false;
            let errorMsg = "";

            while (attempts < 3 && !success) {
                attempts++;
                try {
                    // 웹 앱에 진행 상황 알림 (시작)
                    if (attempts === 1) {
                        notifyWebApp(senderTabId, {
                            action: "SYNC_PROGRESS",
                            index: i,
                            productName: product.name,
                            status: "processing"
                        });
                    }

                    // URL로 이동
                    await chrome.tabs.update(processingTabId, { url: product.url });

                    // 페이지 로드 및 스크립트 준비 대기 (최대 15초)
                    const isReady = await waitForTabReady(processingTabId);

                    if (isReady) {
                        // 담기 명령 전송
                        const response = await sendMessageToTab(processingTabId, {
                            action: "AUTO_ADD_TO_CART",
                            productName: product.name
                        });

                        if (response && response.success) {
                            success = true;
                        } else {
                            throw new Error(response?.error || "담기 실패");
                        }
                    } else {
                        throw new Error("페이지 로드 시간 초과");
                    }

                    // 마켓 서버 부하 방지 및 안정성을 위한 짧은 대기
                    await new Promise(r => setTimeout(r, 2000));

                } catch (err) {
                    console.error(`[CART.ai] Error processing ${product.name} (Attempt ${attempts}):`, err);
                    errorMsg = err.message;
                    // 실패 시 잠시 대기 후 재시도
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (success) {
                results.push({ name: product.name, success: true });
                notifyWebApp(senderTabId, {
                    action: "SYNC_PROGRESS",
                    index: i,
                    status: "success"
                });
            } else {
                results.push({ name: product.name, success: false, error: errorMsg });
                notifyWebApp(senderTabId, {
                    action: "SYNC_PROGRESS",
                    index: i,
                    status: "error",
                    error: errorMsg
                });
            }
        }
    } catch (e) {
        console.error("Critical error in processItems:", e);
    } finally {
        // 작업 완료 후 탭 닫기
        if (processingTabId) {
            chrome.tabs.remove(processingTabId);
        }
    }

    // 마켓별 장바구니 URL 결정 (성공한 첫 번째 항목 또는 요청의 첫 번째 항목 기준)
    const firstProduct = products[0];
    let cartUrl = "https://www.coupang.com/vp/carts";
    if (firstProduct.platform === 'kurly') cartUrl = "https://www.kurly.com/cart";
    if (firstProduct.platform === 'baemin') cartUrl = "https://mart.baemin.com/cart";

    // 최종 완료 알림
    notifyWebApp(senderTabId, {
        action: "SYNC_COMPLETE",
        results: results,
        cartUrl: cartUrl
    });
}

function notifyWebApp(tabId, message) {
    if (tabId) {
        chrome.tabs.sendMessage(tabId, message).catch(() => {
            // 탭이 닫혔거나 메시지를 못받는 상황일 수 있음
        });
    }
}

// 탭이 준비될 때까지 대기하는 유틸리티
async function waitForTabReady(tabId) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // 15초 (0.5초 * 30)

        const check = async () => {
            if (attempts > maxAttempts) return resolve(false);
            try {
                // 탭의 상태가 complete인지 확인
                const tab = await chrome.tabs.get(tabId);
                if (tab.status === 'complete') {
                    // 컨텐츠 스크립트가 로드되었는지 확인 (PING)
                    const response = await sendMessageToTab(tabId, { action: "PING" });
                    if (response && response.status === "pong") return resolve(true);
                }
            } catch (e) { }
            attempts++;
            setTimeout(check, 500);
        };
        check();
    });
}

function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}
