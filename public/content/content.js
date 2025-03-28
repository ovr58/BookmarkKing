/* global chrome */

const getTime = (time) => {
    let date = new Date(null)
    date.setSeconds(time)

    return date.toISOString().substr(11, 8)
}

const errorHandler = (error, nativeMessage = '') => {
    if (error.message === 'Extension context invalidated.') {
        console.log('Extension context invalidated, reloading tab...');
        window.location.reload();
    } else if (nativeMessage !== '') {
        console.error(nativeMessage, error.message);
    } else {
        console.error('Unexpected error:', error.message);
    }
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };

}

function isUnic(obj, oldObj) {
    return JSON.stringify(obj) !== JSON.stringify(oldObj)
}

const contentFunc = () => {

    const contentElementsQuerys = {
        youtubePlayer: ['.video-stream'],
        scruberElement: ['.ytp-right-controls', 'div.ytp-miniplayer-scrim'],
        progressBarElement: ['#ytd-player .ytp-chrome-bottom .ytp-progress-bar', '.ytp-progress-bar', '.ytp-progress-bar-container']
    }
    
    let contentElements = {
        youtubePlayer: [],
        scruberElement: [],
        progressBarElement: []
    }
    
    let durationOld
    let oldObj = {}
    let currentVideoId = ""
    let newVideoLoadedCalled = 0

    const findTruthyElements = (selectors, filterCondition = (element) => element && element.offsetWidth !== 0) => {
        return selectors
        .flatMap(selector => Array.from(document.querySelectorAll(selector)))
        .filter(filterCondition);
    };
    
    const addContainer = (parentElement, containerToAddId) => {
        return new Promise((resolve) => {
            if (!parentElement) {
                resolve()
                return
            }
            const observer = new MutationObserver((_mutations, observer) => {
                const containerToAdd = document.getElementById(containerToAddId);
                if (containerToAdd) {
                    observer.disconnect();
                    resolve(containerToAdd);
                }
            })
            observer.observe(parentElement, { childList: true, subtree: true })
            let containerToAdd = document.createElement('div')
            containerToAdd.id = containerToAddId
            containerToAdd.style.position = 'relative'
            containerToAdd.style.width = '100%'
            containerToAdd.style.height = '100%'
            containerToAdd.style.zIndex = '9999'
            parentElement.appendChild(containerToAdd)
            console.log('Bookmarks container created:', containerToAdd)
            observer.disconnect();
            resolve(containerToAdd);
        })
    }

    const popupMessage = (line1, line2) => {
        const bookMarkBtn = document.getElementsByClassName('bookmark-btn')[0];
        const messageDiv = document.createElement('div');
        messageDiv.style.display = 'block';
        messageDiv.style.justifyContent = 'center';
        messageDiv.style.alignItems = 'center';
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = `${bookMarkBtn.offsetTop - 30}px`;
        messageDiv.style.left = `${bookMarkBtn.offsetRight - 40}px`;
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
        bookMarkBtn.parentElement.parentElement.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    const addBookmarksOnProgressBar = async (bookmarks) => {
        console.log('Progress bar element:', contentElements)
        let containersToAdd = document.querySelectorAll('[id*="bookmarks-container"]')
        if (containersToAdd) {
            for (let containerToAdd of containersToAdd) {
                containerToAdd.remove()
            }
        }
        for (let i = 0; i<contentElements.progressBarElement.length; i++) {
            const progressBarValue = contentElements.youtubePlayer[0].duration
            let bookmarksContainer = await addContainer(contentElements.progressBarElement[i],`bookmarks-container-${i}`)
            let progressBarWidth = bookmarksContainer.offsetWidth
            console.log('Progress bar width:', progressBarWidth, bookmarks)

            for (let bookmark of bookmarks) {
                const bookmarkElement = document.createElement('img')
                bookmarkElement.id = `bookmark-${bookmark.time}-${i}`
                const ifExist = document.getElementById(bookmarkElement.id)
                if (ifExist) {
                    ifExist.remove()
                }
                bookmarkElement.className = 'bookmark-on-progress'
                bookmarkElement.style.cursor = 'pointer'
                bookmarkElement.style.position = 'absolute'
                bookmarkElement.src = chrome.runtime.getURL('assets/bookmark64x64.png')
                console.log('Bookmark left:', bookmark.time, progressBarValue, progressBarWidth, (bookmark.time / progressBarValue) * progressBarWidth)
                bookmarkElement.style.left = `${((bookmark.time / progressBarValue) * progressBarWidth)-8}px`
                bookmarkElement.style.top = '-8px'
                bookmarkElement.style.width = '16px'
                bookmarkElement.style.height = '16px'
                bookmarkElement.style.zIndex = '9999'
                bookmarkElement.title = bookmark.title
                bookmarkElement.addEventListener('click', (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    contentElements.youtubePlayer[0].currentTime = bookmark.time
                    contentElements.youtubePlayer[0].play()
                })
                bookmarksContainer.appendChild(bookmarkElement)
            }
        }
    }

    const addBookmarkButton = () => {
        for (let i = 0; i<contentElements.scruberElement.length; i++) {
            console.log('Add bookmark button:', contentElements.scruberElement[i])
            const bookmarkButtonExists = document.getElementById(`bookmark-btn-${i}`)
            console.log('Bookmark button exists:', bookmarkButtonExists) 
            if (bookmarkButtonExists) {
                bookmarkButtonExists.remove()
            }
            const bookMarkBtn = document.createElement('img')
            bookMarkBtn.src = chrome.runtime.getURL('assets/bookmark64x64.png')
            bookMarkBtn.className = 'ytp-button bookmark-btn'
            bookMarkBtn.id = `bookmark-btn-${i}`
            bookMarkBtn.title = chrome.i18n.getMessage('bookmarkButtonTooltip')
            bookMarkBtn.style.cursor = 'pointer'
            bookMarkBtn.style.position = 'block'
            bookMarkBtn.style.zIndex = '150'
            bookMarkBtn.style.opacity = '0.2'
            bookMarkBtn.style.transition = 'opacity 0.5s'
            contentElements.scruberElement[i].appendChild(bookMarkBtn)
            bookMarkBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                bookmarkClickEventHandler(event.target.className);
            })
            bookMarkBtn.addEventListener('mouseover', () => {
                bookMarkBtn.style.opacity = '1';
            });
            bookMarkBtn.addEventListener('mouseout', () => {
                bookMarkBtn.style.opacity = '0.2';
            });
        }
    }

    const addResizeObserver = () => {

        const isWindowObserverAdded = document.body.getAttribute('resizeObserverAdded')
        const isPlayerObserverAdded = contentElements.youtubePlayer[0].getAttribute('resizeObserverAdded')
        const isDurationChangeObserverAdded = contentElements.youtubePlayer[0].getAttribute('durationObserverAdded')

        if (!isWindowObserverAdded) {
            const resizeObserver = new ResizeObserver(() => {
                debounce(checkAllElements({type: 'RESIZE', videoId: currentVideoId, value: 0}), 1000)
            })
            resizeObserver.observe(document.body)
            document.body.setAttribute('resizeObserverAdded', true)
        }

        if (!isPlayerObserverAdded) {
            console.log('player resize observer will be added:', isPlayerObserverAdded)
            const resizeObserverPlayer = new ResizeObserver(() => {
                debounce(checkAllElements({type: 'RESIZE', videoId: currentVideoId, value: 0}), 1000)
            })
            resizeObserverPlayer.observe(contentElements.youtubePlayer[0])
            contentElements.youtubePlayer[0].setAttribute('resizeObserverAdded', true)
        }

        if (!isDurationChangeObserverAdded) {
            console.log('duration change listener will be added:', isDurationChangeObserverAdded)
            
            contentElements.youtubePlayer[0].addEventListener('durationchange', () => {
                if (durationOld === contentElements.youtubePlayer[0].duration) {
                    return
                }
                durationOld = contentElements.youtubePlayer[0].duration
                debounce(checkAllElements({type: 'RESIZE', videoId: currentVideoId, value: 0}), 1000)
            })
            contentElements.youtubePlayer[0].setAttribute('durationObserverAdded', true)
        }
    }

    const checkIfExists = (bookmarks, newBookmarkTime) => {
        return new Promise((resolve) => {
            for (let element of bookmarks) {
                console.log(element.time, newBookmarkTime)
                const upLimit = element.time + 10 > contentElements.youtubePlayer[0].duration ? contentElements.youtubePlayer[0].duration : element.time + 10
                const lowLimit = element.time - 10 < 0 ? 0 : element.time - 10
                if (newBookmarkTime <= upLimit && newBookmarkTime >= lowLimit) {
                    const msgLine1 = chrome.i18n.getMessage('cantAddBookmarkLine1')
                    const msgLine2 = `${chrome.i18n.getMessage('cantAddBookmarkLine2')} ${getTime(lowLimit)} - ${getTime(upLimit)}`
                    popupMessage(msgLine1, msgLine2)
                    resolve(true)
                    return
                }
            }
            resolve(false)
        })
    }

    const fetchBookmarks = (currentVideoId) => {
        return currentVideoId ? new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([currentVideoId], (obj) => {
                    console.log('Bookmarks fetched IN CONTENT:', obj)
                    if (chrome.runtime.lastError) {
                        const nativeMessage = 'Error fetching bookmarks:'
                        errorHandler(chrome.runtime.lastError, nativeMessage)
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(obj[currentVideoId] ? JSON.parse(obj[currentVideoId]) : []);
                    }
                });
            } catch (error) {
                const nativeMessage = `Error fetching bookmarks: ${currentVideoId}`
                errorHandler(error, nativeMessage)
                reject(error)
            }
    }) : []
    }

    const newVideoLoadedQueue = [];
    let isProcessingNewVideoLoaded = false;

    const processNewVideoLoadedQueue = async () => {
        if (isProcessingNewVideoLoaded || newVideoLoadedQueue.length === 0) {
            return;
        }

        isProcessingNewVideoLoaded = true;
        const { fromMessage, resolve } = newVideoLoadedQueue.shift();

        try {
            await newVideoLoaded(fromMessage);
            resolve();
        } catch (error) {
            console.error('Error processing newVideoLoaded:', error);
            resolve();
        } finally {
            isProcessingNewVideoLoaded = false;
            processNewVideoLoadedQueue();
        }
    };          

    const enqueueNewVideoLoaded = (fromMessage) => {
        return new Promise((resolve) => {
            newVideoLoadedQueue.push({ fromMessage, resolve });
            processNewVideoLoadedQueue();
        });
    };


    const newVideoLoaded = async (fromMessage) => {
        newVideoLoadedCalled++
        const bookmarks = await fetchBookmarks(currentVideoId)
        console.log('Fetch called from newVideoLoaded', fromMessage, newVideoLoadedCalled)
        addBookmarkButton()
        addBookmarksOnProgressBar(bookmarks)
        addResizeObserver()
        newVideoLoadedCalled--
    }

    const bookmarkClickEventHandler = async () => {

        contentElements.youtubePlayer[0].pause()
        
        let currentVideoBookmarks = []

        try {
            currentVideoBookmarks = await fetchBookmarks(currentVideoId)
            console.log('Fetch called from bookmarkClickEventHandler')
        } catch (error) {
            const nativeMessage = 'Error fetching bookmarks:'
            errorHandler(error, nativeMessage)
            return
        }

        const currentTime = contentElements.youtubePlayer[0].currentTime

        const exists = await checkIfExists(currentVideoBookmarks, currentTime)
        if (exists) return

        let currVideoTitle = document.querySelectorAll('#channel-name #text > a')[0].innerText + ' - ' + document.querySelectorAll('#title > h1 > yt-formatted-string')[0].innerText
        console.log('Current video title:', currVideoTitle)
        if (currVideoTitle === ' - ') {
            currVideoTitle = document.getElementById('owner-name').innerText + ' - ' + document.getElementsByClassName('miniplayer-title')[0].innerText
        }
        console.log('Current video title:', currVideoTitle)
        const newBookmark = {
            id: currentVideoId,
            urlTemplate: 'https://www.youtube.com/watch?v=',
            time: currentTime,
            title: currVideoTitle.replace(/[\n\r]+/g, '').trim(),
            bookMarkCaption: currVideoTitle.replace(/[\n\r]+/g, '').trim(),
            color: 'bg-red-600'
        }
        
        chrome.storage.sync.set({[currentVideoId]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a,b) => a.time - b.time))}, async () => {
            await enqueueNewVideoLoaded('bookmarkClickEventHandler')
            console.log('Bookmark added from content.js:', newBookmark)
        });
    }

    const checkAllElements = (obj) => {
        console.log('Check all elements:', obj.type, obj.videoId, obj.value)
        
        contentElements.youtubePlayer = findTruthyElements(contentElementsQuerys.youtubePlayer, (element) => element);
        contentElements.scruberElement = findTruthyElements(contentElementsQuerys.scruberElement);
        contentElements.progressBarElement = findTruthyElements(contentElementsQuerys.progressBarElement);
        console.log('Check all elements:', contentElements.youtubePlayer, contentElements.scruberElement, contentElements.progressBarElement)
        if (contentElements.youtubePlayer.length > 0 && contentElements.scruberElement.length > 0 && contentElements.progressBarElement.length > 0) {
            console.log('Process bookmarks:', obj)
            if (obj.type === 'PLAY') {
                contentElements.youtubePlayer[0].currentTime = obj.value
                contentElements.youtubePlayer[0].play()
            } else if (obj.type === 'UPDATE-ADD') {
                bookmarkClickEventHandler().catch(error => {
                    const nativeMessage = 'Error handling update-add:'
                    errorHandler(error, nativeMessage)
                })
                return
            }
            enqueueNewVideoLoaded('PROCESS').catch(error => {
                const nativeMessage = 'Error handling process:'
                errorHandler(error, nativeMessage)
            })
        } else {
            oldObj = {}
            chrome.runtime.sendMessage({ type: 'ELEMENTS_NOT_FOUND', obj: obj });
        }
    }

    const messageProcess = (obj) => {

        const { type, value, videoId } = obj
        currentVideoId = videoId
        const handleFetchBookmarks = async () => {
            let currentVideoBookmarks = []
            try {
                currentVideoBookmarks = await fetchBookmarks(currentVideoId)
                console.log('Fetch called from onMessage')
                return currentVideoBookmarks
            } catch (error) {
                const nativeMessage = 'Error fetching bookmarks:'
                errorHandler(error, nativeMessage)
                return []
            }
        }
        handleFetchBookmarks().then(
            (currentVideoBookmarks) => {
                if (type === 'NEW') {
                    const handleCheckAllElements = () => {
                        chrome.storage.local.set({ taskStatus: false }, () => {
                            checkAllElements(obj)
                            console.log('Task status set to false, check elements on NEW begun');
                        });
                    }
                    handleCheckAllElements()
                } else if (type === 'PLAY') {
                    const handleCheckAllElements = () => {
                        checkAllElements(obj)
                        console.log('Check elements on PLAY begun');
                    }
                    handleCheckAllElements()
                } else if (type === 'DELETE') {
                    console.log('Delete bookmarks:', value, currentVideoBookmarks)
                    currentVideoBookmarks = currentVideoBookmarks.filter(bookmark => !value.includes(bookmark.time))
                    const handleCheckAllElements = () => {
                        chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, () => {
                            checkAllElements(obj)
                            console.log('Bookmark deleted check all elements begun:', value, currentVideoBookmarks)
                        })
                    }
                    handleCheckAllElements()
                } else if (type === 'UPDATE') {
                    const valueArray = JSON.parse(value)
                    console.log('Update bookmarks:', valueArray)
                    valueArray.forEach((element) => {
                        currentVideoBookmarks = currentVideoBookmarks.map(bookmark => {
                            if (bookmark.time === element.time) {
                                bookmark.bookMarkCaption = element.bookMarkCaption
                                bookmark.color = element.color
                            }
                            return bookmark
                        })
                    })
                    const handleCheckAllElements = () => {
                        if (valueArray.length === 0) {
                            checkAllElements({...obj, type: 'UPDATE-ADD'})
                            console.log('Check elements on UPDATE-ADD begun:', {...obj, type: 'UPDATE-ADD'})
                            return
                        }
                        chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, () => {
                            checkAllElements(obj)
                            console.log('Bookmark updated check for all elements begun:', value, currentVideoBookmarks)
                        })
                    }
                    handleCheckAllElements()
                }
            }
        ).catch(error => {
            const nativeMessage = 'Error handling message:'
            errorHandler(error, nativeMessage)
        })
    }

    const contentOnMeassageListener = (obj) => {
        console.log('Message received in ytmusicontent:', obj)
        if (isUnic(obj, oldObj)) {
            oldObj = obj
            debounce(messageProcess(obj), 1000)
        }
    }

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