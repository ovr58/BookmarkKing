export interface ActiveTab {
    id: number;
    url: string;
}

interface ScriptResult {
    frameId: number;
    result: string | null;
}

export interface VideoElementInfo {
    id: string;
    class: string;
    title: string;
    urlTemplate?: string;
    rect: {
        width: number;
        height: number;
        top: number;
        left: number;
    };
    duration: number;
    time: number;
    bookMarkCaption: string;
    color: string;
}

interface ScriptResultWithVideoElement {
    frameId: number;
    result: VideoElementInfo[] | null;
}

export function getTimestamp(time: number): string {
    const date = new Date(0)
    date.setSeconds(time)
    
    return date.toISOString().substring(11, 19)
}

export async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log('FROM UTILS - Current Tab:', tabs[0])
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
            matchesList.push(match.replace(/\*/g, '').replace('https://', '').replace('http://', ''))
        })
    })
    
    return matchesList
}

export function fetchBookmarks(id: string) {
    return new Promise((resolve) => {
    id !== '' ? chrome.storage.sync.get([id], (obj) => {
        resolve(obj[id] ? JSON.parse(obj[id]) : [])
    }) : resolve([])
})
}

export function fetchVideosWithBookmarks() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (obj: { [key: string]: string }) => {
            console.log('POPUP - Fetch Videos:', obj);
            const videos: { [key: string]: VideoElementInfo[] } = {};
            Object.keys(obj).forEach(key => {
                if (key !== "curTheme") {
                    const video: VideoElementInfo[] = JSON.parse(obj[key]);
                    videos[key] = video;
                }
            });
            resolve(videos);
        });
    });
}

export function getUrlParams(url: string, allowedUrls: string[]): string {
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
    } else if (url.includes('linkedin.com/learning')) {
        urlParams = url.split('/learning/')[1].split('?')[0];
    } else if (url.includes('open.spotify.com')) {
        urlParams = 'spotify';
        } else if (allowedUrls.length > 0 && allowedUrls.some((element: string) => url.includes(element)) && urlParams === '') {
        urlParams = url;
    } else if (url.includes('//extensions') || url.includes('chrome://') || url.includes('edge://') || url.includes('opera://') || url.includes('brave://') || url.includes('vivaldi://') || url.includes('yandex://')) {
        urlParams = 'technical';
    } else {
        urlParams = 'unavailable';
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
                        time: 0,
                        title: 'Start',
                        bookMarkCaption: 'Start of the video',
                        color: 'bg-red-600',
                    }
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

export async function onPlay(tab:ActiveTab ,time: number, id: string): Promise<void> {
    if (tab.id !== undefined && time !== null) {
        await chrome.tabs.sendMessage(tab.id, {
            type: "PLAY",
            value: time,
            videoId: id
        });
    }
    return Promise.resolve();
}

export async function onDelete(tab: ActiveTab, bookmarks: VideoElementInfo[]): Promise<void> {
    console.log('Delete Bookmark')
    const times = bookmarks.map(bookmark => bookmark.time);
    if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, {
            type: "DELETE",
            value: times,
            videoId: bookmarks[0].id
        }, () => {
            console.log('POPUP - Bookmark Deleted Callback Called')
            return Promise.resolve();
        });
    }
}

export async function onUpdate(tab: ActiveTab, bookmarks: VideoElementInfo[], id: string): Promise<void> {
    console.log('Update Bookmark')
    
    if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, {
            type: "UPDATE",
            value: JSON.stringify(
                        bookmarks.map((bookmark) => 
                        (
                            {
                                time: bookmark.time,
                                color: bookmark.color,
                                bookMarkCaption: bookmark.bookMarkCaption
                            }
                        )
                )),
            videoId: id,
        }, () => {
            console.log('POPUP - Bookmark Updated Callback Called')
            return Promise.resolve();
        });
    }
}
