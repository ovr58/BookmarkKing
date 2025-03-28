// /* eslint-disable no-undef */
/* global chrome */

const getTime = (time) => {
    let date = new Date(null)
    date.setSeconds(time)

    return date.toISOString().substr(11, 8)
}

const getSeconds = (timeString) => {
    const units = timeString.split(':').map(Number).reverse();
    const unitMultipliers = [1, 60, 3600, 86400]

    const convert = (units, multipliers) => {
        if (units.length === 0) return 0;
        return units[0] * multipliers[0] + convert(units.slice(1), multipliers.slice(1));
    };

    return convert(units, unitMultipliers);
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
        spotifyPlayer: ['.video-stream.html5-main-video'],
        scruberElement: ['div.Qt226Z4rBQs53aedRQBQ'],
        progressBarElement: ['div[data-testid="playback-progressbar"]'],
        audioPlayerDurationElement: ['div[data-testid="playback-duration"]'],
        audioPLayerCurrentTimeElement: ['div[data-testid="playback-position"]'],
        playButtonElement: ['button[data-testid="control-button-playpause"]'],
        contentChangeElement: ['head > title'],
        idElement: ['a[data-testid="context-item-link"]'],
        contentTitle: ['a[data-testid="context-item-info-show"]', 'a[data-testid="context-item-link"]', 'a[data-testid="context-item-info-artist"]']
    }
    
    let contentElements = {
        spotifyPlayer: [{}],
        scruberElement: [],
        progressBarElement: [],
        audioPlayerDurationElement: [],
        audioPLayerCurrentTimeElement: [],
        playButtonElement: [],
        contentChangeElement: [],
        idElement: [],
        contentTitle: []
    }
    
    let oldObj = {}
    let bookmarkOnProgressBarTop = ['-25px']
    let currentVideoId = ""
    let newVideoLoadedExecutedTimes = 0
    let oldProgressBarSizeBig = 0

    const findTruthyElements = (selectors, filterCondition = (element) => element) => {
        return selectors
        .flatMap(selector => Array.from(document.querySelectorAll(selector)))
        .filter(filterCondition);
    };

    const getFullTitle = () => {
        const contentItemTitle = contentElements.idElement[0]
        const contentTitle = Array.from(new Set(contentElements.contentTitle.map(element => element.textContent))).join(' - ');
        return `${contentItemTitle ? contentItemTitle.textContent : 'Spotify'}${contentTitle}`
    }

    const getDuration = () => {
        const audioPlayerDuration = contentElements.audioPlayerDurationElement[0]
        if (audioPlayerDuration && !audioPlayerDuration.hasAttribute('data-observer-added')) {
            new MutationObserver(async (_mutations, observer) => {
                const audioPlayerDuration = document.querySelectorAll(contentElementsQuerys.audioPlayerDurationElement[0])[0]
                const newDuration = audioPlayerDuration ? audioPlayerDuration.textContent : 0
                if (newDuration !== contentElements.spotifyPlayer[0].duration) {
                    await enqueueNewVideoLoaded()
                    observer.disconnect()
                    audioPlayerDuration.removeAttribute('data-observer-added');
                }
            }).observe(audioPlayerDuration, { childList: true, subtree: true, attributes: true, characterData: true });
            audioPlayerDuration.setAttribute('data-observer-added', 'true');
        }
        return audioPlayerDuration
    }

    const setPlaybackPosition = async (positionPercentage, progressBar) => {
        const rangeInput = progressBar.querySelector('input[type="range"]');
        if (rangeInput) {
            const newValue = parseFloat(rangeInput.max) * positionPercentage / 100;
            rangeInput.value = newValue.toFixed(0);
            console.log('Range input value set:',rangeInput.max, newValue, rangeInput.value, positionPercentage);
            const inputEvent = new Event('input', { bubbles: true, value: newValue.toFixed(0) });
            const changeEvent = new Event('change', { bubbles: true, value: newValue.toFixed(0) });
            rangeInput.dispatchEvent(inputEvent);
            rangeInput.dispatchEvent(changeEvent);
    
            console.log('Range input value set:', newValue);
            console.log('Events dispatched:', { inputEvent, changeEvent });
        } else {
            console.error('Range input not found inside progressBar');
        }

        await new Promise(resolve => setTimeout(resolve, 100))

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

    const popupMessage = (line1, line2, buttonClass) => {
        let bookMarkBtn = document.getElementsByClassName(buttonClass)[0]
        const isExist = document.getElementById('messageDiv')
        if (isExist) {
            isExist.remove()
        }
        const messageDiv = document.createElement('div');
        messageDiv.id = 'messageDiv';
        messageDiv.style.display = 'flex';
        messageDiv.style.flexDirection = 'column';
        messageDiv.style.justifyContent = 'center';
        messageDiv.style.alignItems = 'center';
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = `${bookMarkBtn.offsetTop}px`;
        messageDiv.style.left = `${bookMarkBtn.offsetRight-50}px`;
        messageDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '5px 5px';
        messageDiv.style.height = '40px';
        messageDiv.style.borderRadius = '10px';
        messageDiv.style.textAlign = 'center'
        messageDiv.style.zIndex = '150';

        const messageLine1 = document.createElement('p');
        messageLine1.style.margin = '0';
        messageLine1.style.padding = '0';
        messageLine1.style.height = 'auto';
        messageLine1.innerText = line1;
        const messageLine2 = document.createElement('p');
        messageLine2.style.margin = '0';
        messageLine2.style.paddingTop = '2px';
        messageLine2.style.height = 'auto';
        messageLine2.innerText = line2;
        messageDiv.appendChild(messageLine1);
        messageDiv.appendChild(messageLine2);
        bookMarkBtn.parentElement.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    const addBookmarksOnProgressBar = async (bookmarks) => {
        console.log('Progress bar element:', contentElements.progressBarElement[0])
        let containersToAdd = document.querySelectorAll('[id*="bookmarks-container"]')
        console.log('CONTAINERS TO DELETE:', containersToAdd)
        if (containersToAdd) {
            for (let containerToAdd of containersToAdd) {
                containerToAdd.innerHTML = ''
                containerToAdd.remove()
            }
        }
        const progressBarValue = contentElements.spotifyPlayer[0].duration
        const bookmarksContainer = await addContainer(contentElements.progressBarElement[0],'bookmarks-container-0')
        const progressBarWidth = bookmarksContainer.offsetWidth
        console.log('Progress bar width:', progressBarWidth)
        for (let bookmark of bookmarks) {
            const bookmarkElement = document.createElement('img')
            bookmarkElement.id = 'bookmark-' + bookmark.time
            const ifExist = document.getElementById(bookmarkElement.id)
            if (ifExist) {
                ifExist.remove()
            }
            bookmarkElement.className = 'bookmark-on-progress'
            bookmarkElement.src = chrome.runtime.getURL('assets/bookmark64x64.png')
            bookmarkElement.style.cursor = 'pointer'
            bookmarkElement.style.position = 'absolute'
            console.log('BOOKMARK TIME:', bookmark.time)
            bookmarkElement.style.left = `${((bookmark.time / progressBarValue) * progressBarWidth)-8}px`
            bookmarkElement.style.top = bookmarkOnProgressBarTop[0]
            bookmarkElement.style.width = '16px'
            bookmarkElement.style.height = '16px'
            bookmarkElement.style.zIndex = '9999'
            bookmarkElement.title = `${bookmark.title} - ${getTime(bookmark.time)}`
            bookmarkElement.addEventListener('click', () => {
                contentElements.spotifyPlayer[0].play(bookmark.time)
            })
            bookmarksContainer.appendChild(bookmarkElement)
        }
    }

    const addBookmarkButton = () => {
        console.log('Add bookmark button:', contentElements.scruberElement[0])
        const bookmarkButtonExists = document.getElementById(`bookmark-btn-0`)
        console.log('Bookmark button exists:', bookmarkButtonExists) 
        if (bookmarkButtonExists) {
            bookmarkButtonExists.remove()
        }
        const bookMarkBtn = document.createElement('img')
        bookMarkBtn.src = chrome.runtime.getURL('assets/bookmark64x64.png')
        bookMarkBtn.className = 'bookmark-btn'
        bookMarkBtn.id = `bookmark-btn-0`
        bookMarkBtn.title = chrome.i18n.getMessage('bookmarkButtonTooltip')
        bookMarkBtn.style.cursor = 'pointer'
        bookMarkBtn.style.position = 'block'
        bookMarkBtn.style.width = '32px'
        bookMarkBtn.style.height = '32px'
        bookMarkBtn.style.zIndex = '150'
        bookMarkBtn.style.opacity = '0.4'
        bookMarkBtn.style.transition = 'opacity 0.5s'
        contentElements.scruberElement[0].appendChild(bookMarkBtn)
        bookMarkBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            bookmarkClickEventHandler(event.target.className);
        })
        bookMarkBtn.addEventListener('mouseover', () => {
            bookMarkBtn.style.opacity = '1';
        });
        bookMarkBtn.addEventListener('mouseout', () => {
            bookMarkBtn.style.opacity = '0.4';
        });
    }

    const addResizeObserver = () => {

        const isWindowObserverAdded = document.body.getAttribute('resizeObserverAdded')
        const isContentChangeObserverAdded = contentElements.contentChangeElement[0].getAttribute('contentChangeObserverAdded')
        const isPlayerObserverAdded = contentElements.spotifyPlayer[0].progressBar.getAttribute('resizeObserverAdded')

        if (!isWindowObserverAdded) {
            const resizeObserver = new ResizeObserver(() => {
                const handleFunc = () => debounce(checkAllElements({type: 'RESIZE', videoId: currentVideoId, value: 0}), 1000)
                console.log('Resize observer:', oldProgressBarSizeBig)
                const curProgressBarQueryWidthBig = contentElements.progressBarElement[0].offsetWidth
                if (oldProgressBarSizeBig !== curProgressBarQueryWidthBig) {
                    oldProgressBarSizeBig = curProgressBarQueryWidthBig
                    console.log('Resize observer player changed:', oldProgressBarSizeBig)
                    handleFunc()
                }
            })
            resizeObserver.observe(document.body)
            document.body.setAttribute('resizeObserverAdded', true)
        }

        if (!isContentChangeObserverAdded) {
            const config = { childList: true, subtree: true, attributes: true, characterData: true };
            const callback = () => {
                oldObj = {}
                spotifyOnMessageListener({ type: 'NEW', value: '', videoId: 'spotify' })
            };
            const contentChangeObserver = new MutationObserver(callback)
            contentChangeObserver.observe(contentElements.contentChangeElement[0], config)
            contentElements.contentChangeElement[0].setAttribute('contentChangeObserverAdded', true)
        }

        if (!isPlayerObserverAdded) {
            const resizeObserverPlayer = new ResizeObserver(() => {
                const handleFunc = debounce(checkAllElements({type: 'RESIZE', videoId: currentVideoId, value: 0}), 1000)
                console.log('Resize observer:', oldProgressBarSizeBig)
                const curProgressBarQueryWidthBig = contentElements.progressBarElement[0].offsetWidth
                if (oldProgressBarSizeBig !== curProgressBarQueryWidthBig) {
                    oldProgressBarSizeBig = curProgressBarQueryWidthBig
                    console.log('Resize observer player changed:', oldProgressBarSizeBig)
                    handleFunc()
                }
            })
            resizeObserverPlayer.observe(contentElements.spotifyPlayer[0].progressBar)
            contentElements.spotifyPlayer[0].progressBar.setAttribute('resizeObserverAdded', true)
        }
    }

    const checkIfExists = (bookmarks, newBookmarkTime, buttonClass) => {
        return new Promise((resolve) => {
            for (let element of bookmarks) {
                const time = element.time
                const newTime = newBookmarkTime
                console.log('FROM IS EXISTS: ', element.time, time, newBookmarkTime)
                const upLimit = time + 10 > contentElements.spotifyPlayer[0].duration ? contentElements.spotifyPlayer[0].duration : time + 10
                const lowLimit = time - 10 < 0 ? 0 : time - 10
                if (newTime <= upLimit && newTime >= lowLimit) {
                    const msgLine1 = chrome.i18n.getMessage('cantAddBookmarkLine1')
                    const msgLine2 = `${chrome.i18n.getMessage('cantAddBookmarkLine2')} ${getTime(lowLimit)} - ${getTime(upLimit)}`
                    popupMessage(msgLine1, msgLine2, buttonClass)
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
                    console.log('Bookmarks fetched IN spotify content:', obj)
                    if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError
                        const nativeMessage = 'Error fetching bookmarks:'
                        errorHandler(error, nativeMessage)
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(obj[currentVideoId] ? JSON.parse(obj[currentVideoId]) : []);
                    }
                });
            } catch (error) {
                console.error('Unexpected error:', error.message);
                errorHandler(error);
                reject(error);
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

        newVideoLoadedExecutedTimes++
        const bookmarks = await fetchBookmarks(currentVideoId)
        console.log('Fetch called from newVideoLoaded', fromMessage, newVideoLoadedExecutedTimes)
        addBookmarkButton()
        addBookmarksOnProgressBar(bookmarks)
        addResizeObserver()
        newVideoLoadedExecutedTimes--
        
    }

    const bookmarkClickEventHandler = async (buttonClass) => {
        console.log('Bookmark button clicked', contentElements.spotifyPlayer[0].playState)
        const currentTime = contentElements.spotifyPlayer[0].currentTime
        contentElements.spotifyPlayer[0].playState && contentElements.spotifyPlayer[0].play(currentTime)
        
        let currentVideoBookmarks = []

        try {
            currentVideoBookmarks = await fetchBookmarks(currentVideoId)
        } catch (error) {
            const nativeMessage = 'Error fetching bookmarks:'
            errorHandler(error, nativeMessage)
            return
        }

        const exists = await checkIfExists(currentVideoBookmarks, currentTime, buttonClass)
        if (exists) return

        const currAudioTitle = contentElements.spotifyPlayer[0].title
        const newBookmark = {
            id: currentVideoId,
            urlTemplate: 'https://open.spotify.com/',
            time: currentTime,
            title: currAudioTitle,
            bookMarkCaption: currAudioTitle,
            color: 'bg-green-600'
        }

        chrome.storage.sync.set({[currentVideoId]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a,b) => a.time - b.time))}, async () => {
            await enqueueNewVideoLoaded()
            console.log('Bookmark added from dzencontent.js:', newBookmark)
        })
    }

    const checkAllElements = (obj) => {
        console.log('Check all elements:', obj.type, obj.videoId, obj.value)
        let processFlag = true
        for (let key of Object.keys(contentElements)) {
            if (key !== 'spotifyPlayer') {
                contentElements[key] = findTruthyElements(contentElementsQuerys[key], (element) => element)
                if (contentElements[key].length === 0) {
                    processFlag = false
                    break
                }
            }
        }
        console.log('Check all elements:', contentElements, processFlag)
        if (processFlag) {
            let _duration = getSeconds(contentElements.audioPlayerDurationElement[0].textContent);
            let _title = getFullTitle();
            let _playState = false;
            let _currentTime = getSeconds(contentElements.audioPLayerCurrentTimeElement[0].textContent);
            contentElements.spotifyPlayer[0] = {
                progressBar: contentElements.progressBarElement[0],
                audioPLayerCurrentTime: contentElements.audioPLayerCurrentTimeElement[0],
                playButton: contentElements.playButtonElement[0],
                durationElement: getDuration(),
                fullTitle: getFullTitle(),
                get duration() {
                    return this.durationElement ? getSeconds(this.durationElement.textContent) : _duration
                },
                set duration(value) {
                    _duration = value
                },
                get title() {
                    return this.fullTitle || _title
                },
                set title(value) {
                    _title = value
                },
                get playState() {
                    return this.playButton ? this.playButton.getAttribute('aria-label') === "PLay" ? true : false : _playState
                },
                set playState(value) {
                    _playState = value
                },
                get currentTime() {
                    return this.audioPLayerCurrentTime ? getSeconds(this.audioPLayerCurrentTime.textContent) : _currentTime
                },
                set currentTime(value) {
                    _currentTime = value
                    console.log('Current time set:', value)
                    this.updatePlaybackPosition(value)
                },
                updatePlaybackPosition: async function(position) {
                    console.log('Update playback position:', position, this.duration)
                    let positionPercentage = position / this.duration * 100
                    await setPlaybackPosition(positionPercentage, this.progressBar)
                },
                play: async function(value) {
                    await this.updatePlaybackPosition(value)
                    if (this.playButton) {
                        this.playButton.click();
                        this.playState = !this.playState
                        console.log('Playback started');
                    } else {
                        const nativeMessage = 'Play button not found:'
                        errorHandler(new Error('Play button not found'), nativeMessage)
                    }
                }
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
            const goRender = () => {
                enqueueNewVideoLoaded('PROCESS').catch(error => {
                    const nativeMessage = 'Error handling process:'
                    errorHandler(error, nativeMessage)
                })
            }
            let idElement = contentElements.idElement[0].href.toString().replace('https://open.spotify.com/', '')
            if (idElement.includes('album')) {
                idElement += `/${contentElements.idElement[0].textContent.replaceAll(' ', '_')}`
            }
            currentVideoId = idElement
            handleFetchBookmarks().then((currentVideoBookmarks) => {
                if (obj.type === 'NEW') {
                    console.log('New video loaded')
                    goRender()
                } else if (obj.type === 'PLAY') {
                    console.log('Play video:', obj.value)
                    contentElements.spotifyPlayer[0].play(obj.value)
                } else if (obj.type === 'DELETE') {
                    console.log('Delete bookmarks:', obj.value, currentVideoBookmarks)
                    currentVideoBookmarks = currentVideoBookmarks.filter(bookmark => !obj.value.includes(bookmark.time))
                    const handleCheckAllElements = () => {
                        chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, () => {
                            goRender()
                            console.log('Bookmark deleted check all elements begun:', obj.value, currentVideoBookmarks)
                        })
                    }
                    handleCheckAllElements()
                } else if (obj.type === 'UPDATE') {
                    const valueArray = JSON.parse(obj.value)
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
                    if (valueArray.length === 0) {
                        bookmarkClickEventHandler().catch(error => {
                            const nativeMessage = 'Error handling update-add:'
                            errorHandler(error, nativeMessage)
                        })
                        return
                    }
                    chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, () => {
                        goRender()
                        console.log('Bookmark updated check for all elements begun:', obj.value, currentVideoBookmarks)
                    })
                }
            }
            ).catch(error => {
                const nativeMessage = 'Error handling message:'
                errorHandler(error, nativeMessage)
            })
        } else {
            oldObj = {}
            console.log('Elements not found, retrying...')
            setTimeout(() => chrome.runtime.sendMessage({ type: 'ELEMENTS_NOT_FOUND', obj: obj }), 2000)
        }
    }

    const spotifyOnMessageListener = (obj) => {
        console.log('Message received in ytmusicontent:', obj)
        if (isUnic(obj, oldObj)) {
            oldObj = obj
            debounce(checkAllElements(obj), 1000)
        }
    }

    chrome.storage.local.get('isSpotifyOnMessageListenerAdded', (result) => {
        if (!result.isSpotifyOnMessageListenerAdded) {
            chrome.runtime.onMessage.addListener(spotifyOnMessageListener);
            chrome.storage.local.set({ isSpotifyOnMessageListenerAdded: true }, () => {
                console.log('onMessage listener added');
            });
        } else {
            console.log('onMessage listener already added');
            chrome.runtime.onMessage.removeListener(spotifyOnMessageListener);
            chrome.runtime.onMessage.addListener(spotifyOnMessageListener);
            console.log('onMessage listener re-added');
        }
    });
}

contentFunc()


