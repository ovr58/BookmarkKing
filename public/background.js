/* eslint-disable no-undef */

let updateListener = false
let activateListener = false
let onMessageListener = false

const fetchAllowedUrls = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['allowedUrls'], (obj) => {
            resolve(obj.allowedUrls ? JSON.parse(obj.allowedUrls) : [])
        })
    })
}

const getUrlParams = async (url) => {
    let urlParams = '';
    let allowedUrls = await fetchAllowedUrls()
    console.log('From background - allowedUrls:', allowedUrls, url);
    if (url.includes('www.youtube.com/watch')) {
        const queryParam = url.split('?')[1];
        urlParams = new URLSearchParams(queryParam).get('v') ?? '';
    } else if (/vk(video\.ru|\.com)\/video/.test(url)) {
        urlParams = url.split('/video-')[1];
    } else if (url.includes('dzen.ru')) {
        urlParams = url.split('watch/')[1];
    } else if (url.includes('music.youtube')) {
        const queryParam = url.split('?')[1];
        urlParams = new URLSearchParams(queryParam).get('v') ?? '';
    } else if (url.includes('linkedin.com/learning')) {
        urlParams = url.split('/learning/')[1].split('?')[0];
    } else if (url.includes('open.spotify.com')) {
        urlParams = 'spotify';
    } else if (allowedUrls && allowedUrls.includes(url)) {
        urlParams = url;
    } else if (url.includes('//extensions') || url.includes('chrome://') || url.includes('edge://') || url.includes('opera://') || url.includes('brave://') || url.includes('vivaldi://') || url.includes('yandex://')) {
        urlParams = 'technical';
    }
    return urlParams;
}

!updateListener &&  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    updateListener = true
    console.log("From background - Tab updated:", tabId, changeInfo, tab);
    if (changeInfo.status === 'complete') {
        const handleUpdate = async () => {
            const urlParams = await getUrlParams(tab.url)
            console.log("From background on updated - urlParams:", urlParams);
            urlParams !== '' && chrome.tabs.sendMessage(tabId, {
                type: 'NEW',
                videoId: urlParams,
                url: tab.url
            }, () => {
                if (chrome.runtime.lastError) {
                    console.log("From background - Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("From background - Message sent successfully on updated:", response);
                }
            });
        }
        handleUpdate().catch(console.error);
    }
})

!activateListener && chrome.tabs.onActivated.addListener((activeInfo) => {
    activateListener = true
    console.log("From background - Tab activated:", activeInfo);
    try {
        const handleActivation = async () => {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            const urlParams = await getUrlParams(tab.url)
            console.log("From background - urlParams:", urlParams);
        if (urlParams !== '') {
                chrome.tabs.onUpdated.addListener((_tabId, changeInfo) =>{
                    if (changeInfo.status === 'complete') {
                        const handleUpdate = async () => {
                            console.log("From background - sending message on activated:");
                            chrome.tabs.sendMessage(activeInfo.tabId, {
                                type: 'NEW',
                                videoId: urlParams,
                                url: tab.url
                            }, () => {
                                if (chrome.runtime.lastError) {
                                    console.log("From background - Error sending message:", chrome.runtime.lastError);
                                } else {
                                    console.log("From background - Message sent successfully:", response);
                                }
                            });
                            chrome.tabs.onUpdated.removeListener();
                        }
                        handleUpdate().catch(console.error);
                    }
                });
                chrome.tabs.sendMessage(activeInfo.tabId, {
                    type: 'NEW',
                    videoId: urlParams,
                    url: tab.url
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.log("From background - Error sending message:", chrome.runtime.lastError);
                    } else {
                        console.log("From background - Message sent successfully");
                    }
                });
            }
        }
        handleActivation().catch(console.error);
    } catch (error) {
        console.error('From background - Error getting active tab:', error);
    }
});

!onMessageListener && chrome.runtime.onMessage.addListener((request, sender) => {
    onMessageListener = true
    if (request.type === "ELEMENT_FOUND") {
        const handleElementFound = async () => {
            const urlParams = await getUrlParams(sender.tab.url)
            console.log("From background - Element found, sending 'NEW' message again");
            chrome.tabs.sendMessage(sender.tab.id, { type: 'NEW', videoId: urlParams, url: sender.tab.url }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("From background - Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("From background - Message sent successfully on element found:", response);
                }
            });
        }
        handleElementFound().catch(console.error);
    } else if (request.type === "ALL_ELEMENTS_FOUND") {
        console.log("From background - All elements found");
        chrome.tabs.sendMessage(sender.tab.id, { type: 'PROCESS', videoId: request.obj.videoId, value: request.obj }, (response) => {
            if (chrome.runtime.lastError) {
                console.log("From background - Error sending message:", chrome.runtime.lastError);
            } else {
                console.log("From background - Message sent successfully on all elements found:", response);
            }
        });
    } else if (request.type === 'ELEMENTS_NOT_FOUND') {
        console.log("Elements not found, sending 'NEW' message again")
        chrome.tabs.sendMessage(sender.tab.id, { type: 'NEW', videoId: request.obj.videoId, value: request.obj }, (response) => {
            if (chrome.runtime.lastError) {
                console.log("From background - Error sending message:", chrome.runtime.lastError);
            } else {
                console.log("From background - Message sent successfully on all elements found:", response);
            }
        });
    }
});