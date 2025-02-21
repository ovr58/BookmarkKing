export interface ActiveTab {
    id: number;
    url: string;
}

interface ScriptResult {
    frameId: number;
    result: string | null;
}

export interface Bookmark {
    id: string;
    time: number;
    urlTemplate?: string;
    title: string;
    bookMarkCaption: string;
}

export interface VideoElementInfo {
    id: string;
    class: string;
    title?: string;
    urlTemplate?: string;
    rect: {
        width: number;
        height: number;
        top: number;
        left: number;
    };
    duration: number;
    bookmarks: Bookmark[];
}

interface ScriptResultWithVideoElement {
    frameId: number;
    result: VideoElementInfo[] | null;
}

interface PopUpEvent extends Event {
    target: HTMLButtonElement & EventTarget;
}

export async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0] ? tabs[0] : { id: 0, url: '' }
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

export function getAllowedUrls() {
    const manifest = chrome.runtime.getManifest();
    const matchesList: string[] = []
    manifest.content_scripts?.forEach(contentScript => {
        contentScript.matches?.forEach(match => {
            matchesList.push(match)
        })
    })
    const regexString = matchesList.join('|').replace(/\./g, '\\.').replace(/\*/g, '.*')
    const regex = new RegExp(`^(${regexString})$`)
    return regex
}

export function fetchBookmarks(id: string) {
    return new Promise((resolve) => {
    id !== '' ? chrome.storage.sync.get([id], (obj) => {
        resolve(obj[id] ? JSON.parse(obj[id]) : [])
    }) : resolve([])
})
}

export function fetchVideosWithBookmarks(id: string): Promise<VideoElementInfo[][]> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (obj: { [key: string]: string }) => {
            console.log('POPUP - Fetch Videos:', obj, id);
            let videos: VideoElementInfo[][] = [];
            Object.keys(obj).forEach(key => {
                const video: VideoElementInfo[] = JSON.parse(obj[key]);
                console.log('POPUP - Video:', key, video);
                if (key === id && video.length === 0) {
                    const curVideos: VideoElementInfo[][] = [[{
                        id: key,
                        class: '',
                        title: chrome.i18n.getMessage('currentVideo'),
                        rect: {
                            width: 0,
                            height: 0,
                            top: 0,
                            left: 0
                        },
                        duration: 0,
                        bookmarks: []
                    }]];
                    videos = curVideos;
                } else if (key !== id && video.length === 0) {
                    chrome.storage.sync.remove(key);
                } else if (video.length > 0 && key !== 'allowedUrls') {
                    videos.push(video);
                }
            });
            if (!Object.keys(obj).includes(id) && id) {
                const curVideo: VideoElementInfo[] = [{
                    id: id,
                    class: '',
                    title: chrome.i18n.getMessage('currentVideo'),
                    rect: {
                        width: 0,
                        height: 0,
                        top: 0,
                        left: 0
                    },
                    duration: 0,
                    bookmarks: []
                }];
                videos.push(curVideo);
            }
            resolve(videos);
        });
    });
}

export function getUrlParams(url: string, allowedUrls: RegExp): string {
    let urlParams: string = '';
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
    } else if (url.includes('open.spotify.com')) {
        urlParams = 'spotify';
    } else if (allowedUrls && allowedUrls.test(url)) {
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

export async function checkIfTabHasVideoElement(activeTab: ActiveTab): Promise<VideoElementInfo[]> {
    const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id, allFrames: true },
        func: (): VideoElementInfo[] => {
            const videos = document.querySelectorAll('video');
            console.log('POPUP - VIDEOS:', Array.from(videos));
            return Array.from(videos).map(video => {
                const rect = video.getBoundingClientRect();
                return {
                    id: video.id,
                    class: video.className,
                    rect: {
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        left: rect.left,
                    },
                    duration: video.duration,
                    bookmarks: [
                        {
                            id: '0',
                            time: 0,
                            title: 'Start',
                            bookMarkCaption: 'Start of the video'
                        },
                        {
                            id: '1',
                            time: video.duration,
                            title: 'End',
                            bookMarkCaption: 'End of the video'
                        }
                    ]
                };
            });
        }
    }) as ScriptResultWithVideoElement[];
    console.log('POPUP - Check If Tab Has Video Element:', results);
    return results.flatMap(result => result.result ?? []);
}


export async function openVideo({ id, urlTemplate }: VideoElementInfo): Promise<void> {
    const url = `${urlTemplate}${id}`;
    const urlWithAsterisk = urlTemplate ? urlTemplate.replace('https://', '*://').replace('www.', '*.') : '';

    const tabs = await chrome.tabs.query({ url: `${urlWithAsterisk}${id}` });
    if (tabs.length > 0) {
        if (tabs[0].id !== undefined) {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    } else {
        chrome.tabs.create({ url });
    }
}

export async function onPlay(event: PopUpEvent, id: string): Promise<void> {
    const bookmarkTime = (event.target.parentNode?.parentNode as HTMLElement)?.getAttribute("timestamp");
    const activeTab = await getCurrentTab();

    if (activeTab?.id !== undefined && bookmarkTime !== null) {
        chrome.tabs.sendMessage(activeTab.id, {
            type: "PLAY",
            value: bookmarkTime,
            videoId: id
        });
    }
}

export async function onDelete(event: PopUpEvent, id: string): Promise<void> {
    console.log('Delete Bookmark')
    const activeTab = await getCurrentTab();
    
    const parentNode = event.target.parentNode;
    const grandParentNode = parentNode?.parentNode as HTMLElement | null;
    const bookmarkTime = grandParentNode?.getAttribute("timestamp");
    const bookmarkElementToDelete = document.querySelector(`[timestamp="${bookmarkTime}"]`);
    console.log('POPUP - BookMark Time to delete:', bookmarkElementToDelete)
    if (bookmarkElementToDelete && bookmarkElementToDelete.parentNode) {
        bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);
    }
    
    if (activeTab?.id !== undefined) {
        chrome.tabs.sendMessage(activeTab.id, {
            type: "DELETE",
            value: bookmarkTime,
            videoId: id
        }, () => {
            console.log('POPUP - Bookmark Deleted Callback Called')
            const event = new Event('DOMContentLoaded');
            document.dispatchEvent(event);
        });
    }
}