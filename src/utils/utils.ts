export async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]
}

export function localizeContent() {
    const elements = [...document.querySelectorAll('[data-i18n]'), ...document.querySelectorAll('[i18n-title]')]
    elements.forEach(element => {
        let key = element.getAttribute('data-i18n') 
        if (!key) {
            key = element.getAttribute('i18n-title');
            if (key) {
                (element as HTMLElement).title = chrome.i18n.getMessage(key);
            }
        } else {
            element.textContent = chrome.i18n.getMessage(key)
        }
    })
}

export function fetchAllowedUrls() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['allowedUrls'], (obj) => {
            resolve(obj.allowedUrls)
        })
    })
}

export function getUrlParams(url: string, allowedUrls: string[]): string | null {
    let urlParams: string | null = null;
    if (url.includes('www.youtube.com/watch')) {
        const queryParam = url.split('?')[1];
        urlParams = new URLSearchParams(queryParam).get('v');
    } else if (/vk(video\.ru|\.com)\/video/.test(url)) {
        urlParams = url.split('/video-')[1];
    } else if (url.includes('dzen.ru')) {
        urlParams = url.split('watch/')[1];
    } else if (url.includes('music.youtube')) {
        const queryParam = url.split('?')[1];
        urlParams = new URLSearchParams(queryParam).get('v');
    } else if (url.includes('open.spotify.com')) {
        urlParams = 'spotify';
    } else if (allowedUrls && allowedUrls.includes(url)) {
        urlParams = url;
    } else if (url.includes('//extensions') || url.includes('chrome://') || url.includes('edge://') || url.includes('opera://') || url.includes('brave://') || url.includes('vivaldi://') || url.includes('yandex://')) {
        urlParams = 'technical';
    }
    return urlParams;
}