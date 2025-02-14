
interface Bookmark {
    videoId: string;
    urlTemplate: string;
    time: number;
    title: string;
    bookMarkCaption?: string;
}

const getTime = (time: number): string => {
    const date = new Date(0);
    date.setSeconds(time);
    return date.toISOString().slice(11, 19);
}

interface ErrorHandler {
    (error: Error, nativeMessage?: string): void;
}

const errorHandler: ErrorHandler = (error, nativeMessage = '') => {
    if (error.message === 'Extension context invalidated.') {
        console.log('Extension context invalidated, reloading tab...');
        window.location.reload();
    } else if (nativeMessage !== '') {
        console.error(nativeMessage, error.message);
    } else {
        console.error('Unexpected error:', error.message);
    }
}

const contentFunc = () => {

    let youtubePlayer: HTMLVideoElement;
    let currentVideoId = ""
    let previousAriaValueMax = ""
    let previousProgressBarWidth = 0
    let newVideoLoadedCalled = 0

    interface PopupMessage {
        (line1: string, line2: string): void;
    }

    const popupMessage: PopupMessage = (line1, line2) => {
        const bookMarkBtn = document.getElementsByClassName('bookmark-btn')[0] as HTMLImageElement;
        const messageDiv = document.createElement('div');
        messageDiv.style.display = 'block';
        messageDiv.style.justifyContent = 'center';
        messageDiv.style.alignItems = 'center';
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = `${bookMarkBtn.offsetTop - 30}px`;
        messageDiv.style.left = `${bookMarkBtn.offsetLeft - 40}px`;
        messageDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        messageDiv.style.color = 'white';
        messageDiv.style.height = 'auto';
        messageDiv.style.width = 'auto';
        messageDiv.style.borderRadius = '10px';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.zIndex = '150';

        const messageLine1 = document.createElement('p');
        messageLine1.style.margin = '0';
        messageLine1.style.padding = '3px';
        messageLine1.innerText = line1 + ' ' + line2;

        messageDiv.appendChild(messageLine1);
        bookMarkBtn.parentElement?.parentElement?.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    const clearBookmarksOnProgressBar = () => {
        const deleteOldBookmarks = document.getElementsByClassName('bookmark-on-progress')
        if (deleteOldBookmarks.length === 0) {
            return
        }
        console.log('Delete old bookmarks:', deleteOldBookmarks)
            
        for (const bookmark of deleteOldBookmarks) {
            console.log('Delete bookmark:', bookmark)
            bookmark.remove()
        }
    }

    const addBookmarkButton = () => {
        const bookmarkButtonExists = document.getElementById('bookmark-btn')
        if (bookmarkButtonExists) {
            bookmarkButtonExists.remove()
        }
        const bookMarkBtn = document.createElement('img')
        bookMarkBtn.src = chrome.runtime.getURL('assets/bookmark64x64.png')
        bookMarkBtn.id = 'bookmark-btn'
        bookMarkBtn.className = 'ytp-button ' + 'bookmark-btn'
        bookMarkBtn.title = chrome.i18n.getMessage('bookmarkButtonTooltip')
        bookMarkBtn.style.cursor = 'pointer'
        bookMarkBtn.style.position = 'block'
        bookMarkBtn.style.zIndex = '150'
        bookMarkBtn.style.opacity = '0.2'
        bookMarkBtn.style.transition = 'opacity 0.5s'
        youtubePlayer = document.getElementsByClassName('video-stream')[0] as HTMLVideoElement

        if (youtubePlayer) {
            const scruberElement = document.getElementsByClassName('ytp-right-controls')[0]
            scruberElement.appendChild(bookMarkBtn)
            bookMarkBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                bookmarkClickEventHandler();
            })
            bookMarkBtn.addEventListener('mouseover', () => {
                bookMarkBtn.style.opacity = '1';
            });
            bookMarkBtn.addEventListener('mouseout', () => {
                bookMarkBtn.style.opacity = '0.2';
            });
        }
    }

    interface BookmarkElement extends HTMLImageElement {
        id: string;
        className: string;
        src: string;
        style: CSSStyleDeclaration;
        title: string;
    }

    const addBookmarksOnProgressBar = (bookmarks: Bookmark[]): void => {
        let progressBarElement: HTMLProgressElement = document.querySelectorAll('#ytd-player .ytp-chrome-bottom .ytp-progress-bar')[0] as HTMLProgressElement || document.getElementsByClassName('ytp-progress-bar')[0] as HTMLProgressElement;
        console.log('Progress bar element:', progressBarElement);
        let progressBarWidth: number = progressBarElement.offsetWidth;
        if (progressBarWidth === 0) {
            progressBarElement = document.querySelectorAll('.ytp-progress-bar')[0] as HTMLProgressElement;
            console.log('MINIPLAYER Progress bar element:', progressBarElement);
            progressBarWidth = progressBarElement.offsetWidth;
        }
        const progressBarValue: string | null = progressBarElement.getAttribute('aria-valuemax');
        console.log('Progress bar width:', progressBarWidth, bookmarks);
        for (const bookmark of bookmarks) {
            const bookmarkElement: BookmarkElement = document.createElement('img') as BookmarkElement;
            bookmarkElement.id = 'bookmark-' + bookmark.time;
            const ifExist: HTMLElement | null = document.getElementById(bookmarkElement.id);
            if (ifExist) {
                ifExist.remove();
            }
            bookmarkElement.className = 'ytp-scrubber-container ' + 'bookmark-on-progress';
            bookmarkElement.src = chrome.runtime.getURL('assets/bookmark64x64.png');
            console.log('Bookmark left:', bookmark.time, progressBarValue, progressBarWidth, (bookmark.time / Number(progressBarValue)) * progressBarWidth);
            bookmarkElement.style.left = `${((bookmark.time / Number(progressBarValue)) * progressBarWidth) - 8}px`;
            bookmarkElement.style.top = '-4px';
            bookmarkElement.style.width = '16px';
            bookmarkElement.style.height = '16px';
            bookmarkElement.style.zIndex = '9999';
            bookmarkElement.title = bookmark.title;
            bookmarkElement.addEventListener('click', (event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
                youtubePlayer.currentTime = bookmark.time;
                youtubePlayer.play();
            });
            progressBarElement.appendChild(bookmarkElement);
        }
    }

    interface CheckIfExists {
        (bookmarks: Bookmark[], newBookmarkTime: number): Promise<boolean>;
    }

    const checkIfExists: CheckIfExists = (bookmarks, newBookmarkTime) => {
        return new Promise((resolve) => {
            for (const element of bookmarks) {
                console.log(element.time, newBookmarkTime);
                if (newBookmarkTime <= element.time + 10 && newBookmarkTime >= element.time - 10) {
                    const msgLine1 = chrome.i18n.getMessage('cantAddBookmarkLine1');
                    const msgLine2 = `${chrome.i18n.getMessage('cantAddBookmarkLine2')} ${getTime(element.time - 10)} - ${getTime(element.time + 10)}`;
                    popupMessage(msgLine1, msgLine2);
                    resolve(true);
                    return;
                }
            }
            resolve(false);
        });
    };

    interface FetchBookmarks {
        (currentVideoId: string): Promise<Bookmark[]>;
    }

    const fetchBookmarks: FetchBookmarks = (currentVideoId) => {
        return currentVideoId ? new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([currentVideoId], (obj: { [key: string]: string }) => {
                    console.log('Bookmarks fetched IN CONTENT:', obj);
                    if (chrome.runtime.lastError) {
                        const nativeMessage = 'Error fetching bookmarks:';
                        const customError = new Error(chrome.runtime.lastError.message);
                        errorHandler(customError, nativeMessage);
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(obj[currentVideoId] ? JSON.parse(obj[currentVideoId]) : []);
                    }
                });
            } catch (error) {
                errorHandler(error);
                reject(error);
            }
        }) : Promise.resolve([]);
    };

    interface NewVideoLoaded {
        (fromMessage: string): Promise<void>;
    }

    const newVideoLoaded: NewVideoLoaded = async (fromMessage) => {
        newVideoLoadedCalled++;
        const bookmarks: Bookmark[] = await fetchBookmarks(currentVideoId);
        console.log('Fetch called from newVideoLoaded', fromMessage, newVideoLoadedCalled);
        newVideoLoadedCalled === 1 && addBookmarkButton();
        clearBookmarksOnProgressBar();
        if (bookmarks.length > 0) {
            addBookmarksOnProgressBar(bookmarks);
        }
        addResizeObserver();
        newVideoLoadedCalled--;
    };

    const bookmarkClickEventHandler = async () => {

        youtubePlayer.pause()
        
        let currentVideoBookmarks: Bookmark[] = []

        try {
            currentVideoBookmarks = await fetchBookmarks(currentVideoId)
            console.log('Fetch called from bookmarkClickEventHandler')
        } catch (error) {
            const nativeMessage = 'Error fetching bookmarks:'
            errorHandler(error, nativeMessage)
            return
        }

        const currentTime = youtubePlayer.currentTime

        const exists = await checkIfExists(currentVideoBookmarks, currentTime)
        if (exists) return

        chrome.storage.sync.set({ taskStatus: true }, () => {
            console.log('Task status set to started');
        });
        chrome.runtime.sendMessage({ type: "CREATING_BOOKMARK" })
        const currVideoTitle = document.title.split(' - YouTube')[0].replace(/^\(\d+\)\s*/, '').trim()
        const newBookmark: Bookmark = {
            videoId: currentVideoId,
            urlTemplate: 'https://www.youtube.com/watch?v=',
            time: currentTime,
            title: currVideoTitle + ' - ' + getTime(currentTime),
            bookMarkCaption: currVideoTitle + ' - ' + getTime(currentTime),
        }

        chrome.storage.sync.set({[currentVideoId]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a,b) => a.time - b.time))}, async () => {
            await newVideoLoaded('bookmarkClickEventHandler')
            console.log('Bookmark added from content.js:', newBookmark)
        })
        chrome.storage.sync.set({ taskStatus: false }, () => {
            console.log('Task status set to completed');
        });
        chrome.runtime.sendMessage({ type: "STOP_CREATING_BOOKMARK"})
    }

    const addResizeObserver = () => {

        const isWindowObserverAdded = document.body.getAttribute('resizeObserverAdded')
        const isPlayerObserverAdded = document.getElementsByClassName('video-stream')[0].getAttribute('resizeObserverAdded')
        const isProgressBarObserverAdded = document.getElementsByClassName('ytp-progress-bar')[0].getAttribute('attributesObserverAdded')
        const isProgressBarResizeObserverAdded = document.getElementsByClassName('ytp-progress-bar')[0].getAttribute('resizeObserverAdded')

        if (!isWindowObserverAdded) {
            const resizeObserver = new ResizeObserver(() => {
                const handleFunc = async () => await newVideoLoaded('RESIZE WINDOW')
                handleFunc().catch(error => {
                    const nativeMessage = 'Error handling resize:'
                    errorHandler(error, nativeMessage)
                })
            })
            resizeObserver.observe(document.body)
            document.body.setAttribute('resizeObserverAdded', 'true')
        }

        if (!isPlayerObserverAdded) {
            const resizeObserverPlayer = new ResizeObserver(() => {
                const handleFunc = async () => await newVideoLoaded('RESIZE PLAYER')
                handleFunc().catch(error => {
                    const nativeMessage = 'Error handling resize:'
                    errorHandler(error, nativeMessage)
                })
            })
            resizeObserverPlayer.observe(document.getElementsByClassName('video-stream')[0])
            document.getElementsByClassName('video-stream')[0].setAttribute('resizeObserverAdded', 'true')
        }

        if (!isProgressBarResizeObserverAdded) {
            const resizeObserverProgressBar = new ResizeObserver((entries) => {
                const handleFunc = async () => await newVideoLoaded('RESIZE PROGRESS BAR')
                if ((entries[entries.length - 1].target as HTMLElement).offsetWidth !== previousProgressBarWidth) {
                    console.log('PBR !!!!!!! :', (entries[entries.length - 1].target as HTMLElement).offsetWidth)
                    handleFunc().catch(error => {
                        const nativeMessage = 'Error handling resize:'
                        errorHandler(error, nativeMessage)
                    })
                    previousProgressBarWidth = (entries[entries.length - 1].target as HTMLElement).offsetWidth
                }
            })
            resizeObserverProgressBar.observe(document.getElementsByClassName('ytp-progress-bar')[0])
            document.getElementsByClassName('ytp-progress-bar')[0].setAttribute('resizeObserverAdded', 'true')
        }

        if (!isProgressBarObserverAdded) {
            const progressBarMutationObserver = new MutationObserver((mutationList) => {
                const handleFunc = async () => {
                    console.log('PBM !!!!!!! :', mutationList)
                    await newVideoLoaded('PROGRESS BAR MUTATION')
                }
                if (mutationList[mutationList.length - 1].attributeName === 'aria-valuemax' && (mutationList[mutationList.length - 1].target as Element).getAttribute('aria-valuemax') !== previousAriaValueMax) {
                    handleFunc().catch(error => {
                        const nativeMessage = 'Error handling resize:'
                        errorHandler(error, nativeMessage)
                    })
                    previousAriaValueMax = (mutationList[mutationList.length - 1].target as Element).getAttribute('aria-valuemax') || ''
                }
            })
            progressBarMutationObserver.observe(document.getElementsByClassName('ytp-progress-bar')[0], {attributes: true, attributeFilter: ['aria-valuemax']})
            document.getElementsByClassName('ytp-progress-bar')[0].setAttribute('resizeObserverAdded', 'true')
        }
    }

    interface Message {
        type: string;
        value?: string | number;
        videoId: string;
    }

    const contentOnMeassageListener = (obj: Message) => {
        const { type, value, videoId } = obj;
        currentVideoId = videoId;
        const handleFetchBookmarks = async (): Promise<Bookmark[]> => {
            let currentVideoBookmarks: Bookmark[] = [];
            try {
                currentVideoBookmarks = await fetchBookmarks(currentVideoId);
                console.log('Fetch called from onMessage');
                return currentVideoBookmarks;
            } catch (error) {
                const nativeMessage = 'Error fetching bookmarks:';
                errorHandler(error, nativeMessage);
                return [];
            }
        };
        handleFetchBookmarks().then(
            (currentVideoBookmarks) => {
                if (type === 'NEW') {
                    const handleNewVideoLoaded = async () => {
                        chrome.storage.sync.set({ taskStatus: false }, async () => {
                            await newVideoLoaded('NEW');
                            console.log('Task status set to false');
                        });
                    };
                    handleNewVideoLoaded().catch(error => {
                        const nativeMessage = 'Error handling new video loaded:';
                        errorHandler(error, nativeMessage);
                    });
                } else if (type === 'PLAY') {
                    if (typeof value === 'number') {
                        youtubePlayer.currentTime = value;
                    }
                } else if (type === 'DELETE') {
                    const handleDeleteBookmark = async () => {
                        chrome.storage.sync.set({ [currentVideoId]: JSON.stringify(currentVideoBookmarks) }, async () => {
                            await newVideoLoaded('DELETE');
                            console.log('Bookmark deleted:', value, currentVideoBookmarks);
                        });
                    };
                    console.log('Delete bookmark:', value, currentVideoBookmarks);
                    currentVideoBookmarks = currentVideoBookmarks.filter(bookmark => bookmark.time != value);
                    handleDeleteBookmark().catch(error => {
                        const nativeMessage = 'Error deleting bookmark:';
                        errorHandler(error, nativeMessage);
                    });
                } else if (type === 'UPDATE') {
                    if (typeof value === 'string') {
                        const { time, title } = JSON.parse(value);
                        currentVideoBookmarks = currentVideoBookmarks.map(bookmark => {
                            if (bookmark.time === time) {
                                bookmark.title = title;
                            }
                            return bookmark;
                        });
                        currentVideoBookmarks = currentVideoBookmarks.map(bookmark => {
                            if (bookmark.time === time) {
                                bookmark.title = title;
                            }
                            return bookmark;
                        });
                    }
                    const handleUpdateBookmark = async () => {
                        chrome.storage.sync.set({ [currentVideoId]: JSON.stringify(currentVideoBookmarks) }, async () => {
                            await newVideoLoaded('UPDATE');
                            console.log('Bookmark updated:', value, currentVideoBookmarks);
                        });
                    };
                    handleUpdateBookmark().catch(error => {
                        const nativeMessage = 'Error updating bookmark:';
                        errorHandler(error, nativeMessage);
                    });
                }
            }
        ).catch(error => {
            const nativeMessage = 'Error handling fetch bookmarks:';
            errorHandler(error, nativeMessage);
        });
        console.log('Message received in content.js:', obj);
        return true;
    };

    chrome.storage.local.get('isMessageListenerAdded', (result) => {
        if (!result.isMessageListenerAdded) {
            chrome.runtime.onMessage.addListener(contentOnMeassageListener);
            chrome.storage.local.set({ isMessageListenerAdded: true }, () => {
                console.log('onMessage listener added');
            });
        } else {
            console.log('onMessage listener already added');
            chrome.runtime.onMessage.removeListener(contentOnMeassageListener);
            chrome.runtime.onMessage.addListener(contentOnMeassageListener);
            console.log('onMessage listener re-added');
        }
    });
};

contentFunc();

