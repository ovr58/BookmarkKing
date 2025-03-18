// /* eslint-disable no-undef */
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

const contentFunc = () => {

    const contentElementsQuerys = {
        youtubePlayer: ['.video-stream'],
        scruberElement: ['.ytp-right-controls'],
        progressBarElement: ['#ytd-player .ytp-chrome-bottom .ytp-progress-bar', '.ytp-progress-bar', '.ytp-progress-bar-container']
    }

    const contentElements = {
        youtubePlayer: document.querySelectorAll(contentElementsQuerys.youtubePlayer[0])[0],
        scruberElement: document.querySelectorAll(contentElementsQuerys.scruberElement[0])[0],
        progressBarElement: document.querySelectorAll(contentElementsQuerys.progressBarElement[0])[0]
    }

    let currentVideoId = ""
    let previousAriaValueMax = 0
    let previousProgressBarWidth = 0
    let newVideoLoadedCalled = 0

    const checkForElement = (element) => {
        if (element) {
            chrome.runtime.sendMessage({ type: 'ELEMENT_FOUND' });
            return true;
        }
        return false;
    };

    const checkAllElements = () => {
        console.log('Checking all elements:', contentElements)
        for (const key in contentElementsQuerys) {
            let foundNumber = 0
            for (const element of contentElementsQuerys[key]) {
                const elementToCheck = document.querySelectorAll(element)[0];
                const isElementAttrSet = document.body.getAttribute(`is${key}Set`);
                if (!elementToCheck && !isElementAttrSet) {
                    const observer = new MutationObserver((_mutations, observer) => {
                        const idElement = document.querySelectorAll(element)[0]
                        console.log('Mutation observer:', idElement)
                        if (checkForElement(idElement)) {
                            if (!contentElements[key] || contentElements[key].offsetWidth === 0) {
                                contentElements[key] = idElement
                            }
                            console.log('Element found:', idElement)
                            observer.disconnect();
                            document.body.setAttribute(`is${key}Set`, false);
                        }
                    });
                
                    observer.observe(document.body, { childList: true, subtree: true });
                    document.body.setAttribute(`is${key}Set`, true);
                } else if (elementToCheck && elementToCheck.offsetWidth !== 0) {
                    if (!contentElements[key] || contentElements[key].offsetWidth === 0) {
                        contentElements[key] = elementToCheck
                        foundNumber++
                    }
                }
            }
            if (foundNumber === 0) throw new Error(`Elements not found: ${contentElements[key]}`);
        }
        return true
    }

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
            let containerToAdd = document.getElementById(containerToAddId)
            if (!containerToAdd) {
                containerToAdd = document.createElement('div')
                containerToAdd.id = containerToAddId
                containerToAdd.style.position = 'relative'
                containerToAdd.style.width = '100%'
                containerToAdd.style.height = '100%'
                containerToAdd.style.zIndex = '9999'
                parentElement.appendChild(containerToAdd)
                console.log('Bookmarks container created:', containerToAdd)
            } else {
                containerToAdd.innerHTML = ''
                observer.disconnect();
                resolve(containerToAdd);
            }
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

        contentElements.scruberElement.appendChild(bookMarkBtn)
        bookMarkBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            bookmarkClickEventHandler(event);
        })
        bookMarkBtn.addEventListener('mouseover', () => {
            bookMarkBtn.style.opacity = '1';
        });
        bookMarkBtn.addEventListener('mouseout', () => {
            bookMarkBtn.style.opacity = '0.2';
        });
    }

    const addBookmarksOnProgressBar = async (bookmarks) => {
        
        console.log('Progress bar element:', contentElements.progressBarElement)
        
        const progressBarValue = contentElements.youtubePlayer.duration
        let bookmarksContainer = await addContainer(contentElements.progressBarElement,'bookmarks-container')
        let progressBarWidth = bookmarksContainer.offsetWidth
        console.log('Progress bar width:', progressBarWidth, bookmarks)

        for (let bookmark of bookmarks) {
            const bookmarkElement = document.createElement('img')
            bookmarkElement.id = 'bookmark-' + bookmark.time
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
                contentElements.youtubePlayer.currentTime = bookmark.time
                contentElements.youtubePlayer.play()
            })
            bookmarksContainer.appendChild(bookmarkElement)
        }
    }

    const checkIfExists = (bookmarks, newBookmarkTime) => {
        return new Promise((resolve) => {
            for (let element of bookmarks) {
                console.log(element.time, newBookmarkTime)
                const upLimit = element.time + 10 > contentElements.youtubePlayer.duration ? contentElements.youtubePlayer.duration : element.time + 10
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

    const newVideoLoaded = async (fromMessage) => {
        newVideoLoadedCalled++
        try {
            checkAllElements()
        }
        catch (error) {
            const nativeMessage = 'Error checking all elements:'
            errorHandler(error, nativeMessage)
            return
        }
        const bookmarks = await fetchBookmarks(currentVideoId)
        console.log('Fetch called from newVideoLoaded', fromMessage, newVideoLoadedCalled)
        newVideoLoadedCalled === 1 && addBookmarkButton()
        addBookmarksOnProgressBar(bookmarks)
        addResizeObserver()
        newVideoLoadedCalled--
    }

    const bookmarkClickEventHandler = async () => {

        contentElements.youtubePlayer.pause()
        
        let currentVideoBookmarks = []

        try {
            currentVideoBookmarks = await fetchBookmarks(currentVideoId)
            console.log('Fetch called from bookmarkClickEventHandler')
        } catch (error) {
            const nativeMessage = 'Error fetching bookmarks:'
            errorHandler(error, nativeMessage)
            return
        }

        const currentTime = contentElements.youtubePlayer.currentTime

        const exists = await checkIfExists(currentVideoBookmarks, currentTime)
        if (exists) return

        const currVideoTitle = document.title.split(' - YouTube')[0].replace(/^\(\d+\)\s*/, '').trim()
        const newBookmark = {
            id: currentVideoId,
            urlTemplate: 'https://www.youtube.com/watch?v=',
            time: currentTime,
            title: currVideoTitle,
            bookMarkCaption: currVideoTitle,
            color: 'bg-red-600'
        }
        
        chrome.storage.sync.set({[currentVideoId]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a,b) => a.time - b.time))}, async () => {
            await newVideoLoaded('bookmarkClickEventHandler')
            console.log('Bookmark added from content.js:', newBookmark)
        });
    }

    const addResizeObserver = () => {

        const isWindowObserverAdded = document.body.getAttribute('resizeObserverAdded')
        const isPlayerObserverAdded = contentElements.youtubePlayer.getAttribute('resizeObserverAdded')
        const isProgressBarObserverAdded = contentElements.progressBarElement.getAttribute('attributesObserverAdded')
        const isProgressBarResizeObserverAdded = contentElements.progressBarElement.getAttribute('resizeObserverAdded')

        if (!isWindowObserverAdded) {
            const resizeObserver = new ResizeObserver(() => {
                const handleFunc = async () => await newVideoLoaded('RESIZE WINDOW')
                handleFunc().catch(error => {
                    const nativeMessage = 'Error handling resize:'
                    errorHandler(error, nativeMessage)
                })
            })
            resizeObserver.observe(document.body)
            document.body.setAttribute('resizeObserverAdded', true)
        }

        if (!isPlayerObserverAdded) {
            const resizeObserverPlayer = new ResizeObserver(() => {
                const handleFunc = async () => await newVideoLoaded('RESIZE PLAYER')
                handleFunc().catch(error => {
                    const nativeMessage = 'Error handling resize:'
                    errorHandler(error, nativeMessage)
                })
            })
            resizeObserverPlayer.observe(contentElements.youtubePlayer)
            contentElements.youtubePlayer.setAttribute('resizeObserverAdded', true)
        }

        if (!isProgressBarResizeObserverAdded) {
            const resizeObserverProgressBar = new ResizeObserver((entries) => {
                const handleFunc = async () => await newVideoLoaded('RESIZE PROGRESS BAR')
                if (entries[entries.length - 1].target.offsetWidth !== previousProgressBarWidth) {
                    console.log('PBR !!!!!!! :', entries[entries.length - 1].target.offsetWidth)
                    handleFunc().catch(error => {
                        const nativeMessage = 'Error handling resize:'
                        errorHandler(error, nativeMessage)
                    })
                    previousProgressBarWidth = entries[entries.length - 1].target.offsetWidth
                }
            })
            resizeObserverProgressBar.observe(contentElements.progressBarElement)
            contentElements.progressBarElement.setAttribute('resizeObserverAdded', true)
        }

        if (!isProgressBarObserverAdded) {
            const progressBarMutationObserver = new MutationObserver((mutationList) => {
                const handleFunc = async () => {
                    console.log('PBM !!!!!!! :', mutationList)
                    await newVideoLoaded('PROGRESS BAR MUTATION')
                }
                if (mutationList[mutationList.length - 1].attributeName === 'aria-valuemax' && mutationList[mutationList.length - 1].target.getAttribute('aria-valuemax') !== previousAriaValueMax) {
                    handleFunc().catch(error => {
                        const nativeMessage = 'Error handling resize:'
                        errorHandler(error, nativeMessage)
                    })
                    previousAriaValueMax = mutationList[mutationList.length - 1].target.getAttribute('aria-valuemax')
                }
            })
            progressBarMutationObserver.observe(contentElements.progressBarElement, {attributes: true, attributeFilter: ['aria-valuemax']})
            contentElements.progressBarElement.setAttribute('attributesObserverAdded', true)
        }
    }

    const contentOnMeassageListener = (obj) => {
        const { type, value, videoId } = obj
        currentVideoId = videoId

        try {
            checkAllElements()
        }
        catch (error) {
            const nativeMessage = 'Error checking all elements:'
            errorHandler(error, nativeMessage)
            return
        }

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
                    const handleNewVideoLoaded = async () => {
                        chrome.storage.local.set({ taskStatus: false }, async () => {
                            await newVideoLoaded('NEW')
                            console.log('Task status set to false');
                        });
                    }
                    handleNewVideoLoaded().catch(error => {
                        const nativeMessage = 'Error handling new video loaded:'
                        errorHandler(error, nativeMessage)
                    })
                } else if (type === 'PLAY') {
                    contentElements.youtubePlayer.currentTime = value
                } else if (type === 'DELETE') {
                    console.log('Delete bookmarks:', value, currentVideoBookmarks)
                    currentVideoBookmarks = currentVideoBookmarks.filter(bookmark => !value.includes(bookmark.time))
                    const handleDeleteBookmark = async () => {
                        chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, async () => {
                            await newVideoLoaded('DELETE')
                            console.log('Bookmark deleted:', value, currentVideoBookmarks)
                        })
                    }
                    handleDeleteBookmark().catch(error => {
                        const nativeMessage = 'Error deleting bookmark:'
                        errorHandler(error, nativeMessage)
                    })
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
                    const handleUpdateBookmark = async () => {
                        if (valueArray.length === 0) {
                            await bookmarkClickEventHandler()
                            return
                        }
                        chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, async () => {
                            await newVideoLoaded('UPATE')
                            console.log('Bookmark updated:', value, currentVideoBookmarks)
                        })
                    }
                    handleUpdateBookmark().catch(error => {
                        const nativeMessage = 'Error updating bookmark:'
                        errorHandler(error, nativeMessage)
                    })
                }
            }
        ).catch(error => {
            const nativeMessage = 'Error handling fetch bookmarks:'
            errorHandler(error, nativeMessage)
        })
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

