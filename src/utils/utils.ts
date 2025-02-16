interface ActiveTab {
    id: number;
}

interface ScriptResult {
    frameId: number;
    result: string | null;
}

interface Video {
    videoId: string;
    title: string;
}

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

export function fetchBookmarks(videoId: string) {
    return new Promise((resolve) => {
    chrome.storage.sync.get([videoId], (obj) => {
        resolve(obj[videoId] ? JSON.parse(obj[videoId]) : [])
    })
})
}

export function fetchVideosWithBookmarks(videoId: string): Promise<Video[][]> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (obj: { [key: string]: string }) => {
            console.log('POPUP - Fetch Videos:', obj, videoId);
            const videos: Video[][] = [];
            Object.keys(obj).forEach(key => {
                const video: Video[] = JSON.parse(obj[key]);
                console.log('POPUP - Video:', key, video);
                if (key === videoId && video.length === 0) {
                    const curVideo: Video[] = [{
                        videoId: key,
                        title: chrome.i18n.getMessage('currentVideo')
                    }];
                    videos.push(curVideo);
                } else if (key !== videoId && video.length === 0) {
                    chrome.storage.sync.remove(key);
                } else if (video.length > 0 && key !== 'allowedUrls') {
                    videos.push(video);
                }
            });
            if (!Object.keys(obj).includes(videoId) && videoId) {
                const curVideo: Video[] = [{
                    videoId: videoId,
                    title: chrome.i18n.getMessage('currentVideo')
                }];
                videos.push(curVideo);
            }
            resolve(videos);
        });
    });
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

export async function getSpotifyVideoId(activeTab: ActiveTab): Promise<string | null> {
    const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id, allFrames: true },
        func: (): string | null => {
            const idElement = document.querySelectorAll('a[data-testid="context-item-link"]')[0] as HTMLAnchorElement | undefined;
            if (idElement) {
                let idHref = idElement.href;
                if (idHref.includes('album')) {
                    idHref += `/${idElement.textContent?.replace(/ /g, '_')}`;
                }
                return idHref;
            } else {
                return null;
            }
        }
    }) as ScriptResult[];
    console.log('POPUP - Spotify Video Id:', results);
    return results.flatMap(result => result.result ?? null).filter(Boolean)[0];
}