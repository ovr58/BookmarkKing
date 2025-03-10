/* eslint-disable no-undef */

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

let podcastElementPreviousText = ''

const contentFunc = () => {

    let spotifyPlayer = {}
    let currentVideoId = ""
    let curProgressBarQueryBig = 'div[data-testid="playback-progressbar"]'
    let audioPlayerDurationElement = 'div[data-testid="playback-duration"]'
    let audioPLayerCurrentTimeElement = 'div[data-testid="playback-position"]'
    let playButtonElement = 'button[data-testid="control-button-playpause"]'
    let newAudioLoadedExecutedTimes = 0
    let curBookmarkButtonContainerBig = 'div.Qt226Z4rBQs53aedRQBQ'
    let oldProgressBarSizeBig = 0
    let bookmarkOnProgressBarTopBig = '-25px'

    const checkForElement = (element) => {
        if (element) {
            chrome.runtime.sendMessage({ type: 'ELEMENT_FOUND' });
            return true;
        }
        return false;
    };

    const getFullTitle = () => {
        const contentItemTitle = document.querySelectorAll('a[data-testid="context-item-link"]')[0]
        const contentTitle = document.querySelectorAll('a[data-testid="context-item-info-show"]')[0]
        const contentArtist = document.querySelectorAll('a[data-testid="context-item-info-artist"]')[0]
        return `${contentItemTitle ? contentItemTitle.textContent : 'Spotify'}${contentTitle ? ` - ${contentTitle.textContent}` : ''}${contentArtist ? ` - ${contentArtist.textContent}` : ''}`
    }

    const getDuration = () => {
        const audioPlayerDuration = document.querySelectorAll(audioPlayerDurationElement)[0]
        if (audioPlayerDuration && !audioPlayerDuration.hasAttribute('data-observer-added')) {
            new MutationObserver(async () => {
                const audioPlayerDuration = document.querySelectorAll('div[data-testid="playback-duration"]')[0]
                const newDuration = audioPlayerDuration ? audioPlayerDuration.textContent : 0
                if (newDuration !== spotifyPlayer.duration) {
                    await newVideoLoaded()
                }
            }).observe(audioPlayerDuration, { childList: true, subtree: true, attributes: true, characterData: true });
            audioPlayerDuration.setAttribute('data-observer-added', 'true');
        }
        return audioPlayerDuration
    }

    const setPlaybackPosition = async (positionPercentage, progressBar) => {
        const rangeInput = progressBar.querySelector('input[type="range"]');
        if (rangeInput) {
            // Установите новое значение для input
            const newValue = parseFloat(rangeInput.max) * positionPercentage / 100;
            rangeInput.value = newValue.toFixed(0);
            console.log('Range input value set:', newValue, rangeInput.value, positionPercentage);
            // Создайте и инициируйте события input и change
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
            const observer = new MutationObserver((mutations, observer) => {
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

    const addBookmarkButton = () => {
        const bookmarkButtonExistsBig = document.getElementById('bookmark-btn')
        console.log('Bookmark button exists:', bookmarkButtonExistsBig) 
        console.log('Bookmark button exists:',  bookmarkButtonExistsBig) 
        if (bookmarkButtonExistsBig) {
            bookmarkButtonExistsBig.remove()
        }
        let scruberElementBig = document.querySelectorAll(curBookmarkButtonContainerBig)[0]
        console.log('Scrubber element big:', scruberElementBig)
        if (scruberElementBig) {
            const bookMarkBtn = document.createElement('img')
            bookMarkBtn.src = chrome.runtime.getURL('assets/bookmark64x64.png')
            bookMarkBtn.className = 'bookmark-btn'
            bookMarkBtn.id = 'bookmark-btn'
            bookMarkBtn.title = chrome.i18n.getMessage('bookmarkButtonTooltip')
            bookMarkBtn.style.cursor = 'pointer'
            bookMarkBtn.style.position = 'block'
            bookMarkBtn.style.width = '32px'
            bookMarkBtn.style.height = '32px'
            bookMarkBtn.style.zIndex = '150'
            bookMarkBtn.style.opacity = '0.2'
            bookMarkBtn.style.transition = 'opacity 0.5s'
            scruberElementBig.appendChild(bookMarkBtn)
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

    const addBookmarksOnProgressBar = async (bookmarks) => {
        const progressBarElementBig = document.querySelectorAll(curProgressBarQueryBig)[0]
        console.log('Progress bar element:', progressBarElementBig)
        const progressBarValue = spotifyPlayer.duration
        const bookmarksContainerBig = await addContainer(progressBarElementBig,'bookmarks-container')
        const progressBarWidthBig = bookmarksContainerBig.offsetWidth

        console.log('Progress bar width:', progressBarWidthBig)
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
            bookmarkElement.style.left = `${((bookmark.time / progressBarValue) * progressBarWidthBig)-8}px`
            bookmarkElement.style.top = bookmarkOnProgressBarTopBig
            bookmarkElement.style.width = '16px'
            bookmarkElement.style.height = '16px'
            bookmarkElement.style.zIndex = '9999'
            bookmarkElement.title = `${bookmark.title} - ${bookmark.time}`
            bookmarkElement.addEventListener('click', () => {
                spotifyPlayer.currentTime = bookmark.time
                console.log('Play bookmark:', spotifyPlayer, bookmark.time)
                spotifyPlayer.play(bookmark.time)
            })
            bookmarksContainerBig.appendChild(bookmarkElement)
        }
    }

    const addResizeObserver = () => {

        const isWindowObserverAdded = document.body.getAttribute('resizeObserverAdded')
        const isContentChangeObserverAdded = document.querySelectorAll('head > title')[0].getAttribute('contentChangeObserverAdded')
        const isPlayerObserverAdded = spotifyPlayer.progressBar.getAttribute('resizeObserverAdded')

        if (!isWindowObserverAdded) {
            const resizeObserver = new ResizeObserver(() => {
                const handleFunc = async () => await newVideoLoaded('RESIZE WINDOW')
                console.log('Resize observer:', oldProgressBarSizeBig)
                const curProgressBarQueryWidthBig = document.querySelectorAll(curProgressBarQueryBig)[0].offsetWidth
                if (oldProgressBarSizeBig !== curProgressBarQueryWidthBig) {
                    oldProgressBarSizeBig = curProgressBarQueryWidthBig
                    console.log('Resize observer player changed:', oldProgressBarSizeBig)
                    handleFunc().catch(error => {
                        const nativeMessage = 'Error handling resize:'
                        errorHandler(error, nativeMessage)
                    })
                }
            })
            resizeObserver.observe(document.body)
            document.body.setAttribute('resizeObserverAdded', true)
        }

        if (!isContentChangeObserverAdded) {
            const config = { childList: true, subtree: true, attributes: true, characterData: true };
            const callback = (mutationsList) => {
                console.log('Content change observer:', mutationsList)
                const podcastElementText = document.querySelector('a[data-testid="context-item-link"]').textContent;
                if (podcastElementText !== podcastElementPreviousText) {
                    console.log('Podcast element changed:', podcastElementText);
                    podcastElementPreviousText = podcastElementText;
                    spotifyOnMessageListener({ type: 'NEW', value: '', videoId: 'spotify' })
                }
            };
            const contentChangeObserver = new MutationObserver(callback)
            contentChangeObserver.observe(document.querySelectorAll('head > title')[0], config)
            document.querySelectorAll('head > title')[0].setAttribute('contentChangeObserverAdded', true)
        }

        if (!isPlayerObserverAdded) {
            const resizeObserverPlayer = new ResizeObserver(() => {
                const handleFunc = async () => await newVideoLoaded('RESIZE WINDOW')
                console.log('Resize observer:', oldProgressBarSizeBig)
                const curProgressBarQueryWidthBig = document.querySelectorAll(curProgressBarQueryBig)[0].offsetWidth
                if (oldProgressBarSizeBig !== curProgressBarQueryWidthBig) {
                    oldProgressBarSizeBig = curProgressBarQueryWidthBig
                    console.log('Resize observer player changed:', oldProgressBarSizeBig)
                    handleFunc().catch(error => {
                        const nativeMessage = 'Error handling resize:'
                        errorHandler(error, nativeMessage)
                    })
                }
            })
            resizeObserverPlayer.observe(spotifyPlayer.progressBar)
            spotifyPlayer.progressBar.setAttribute('resizeObserverAdded', true)
        }
    }

    const checkIfExists = (bookmarks, newBookmarkTime, buttonClass) => {
        return new Promise((resolve) => {
            for (element of bookmarks) {
                const time = element.time
                const newTime = newBookmarkTime
                console.log('FROM IS EXISTS: ', element.time, time, newBookmarkTime)
                const upLimit = time + 10 > spotifyPlayer.duration ? spotifyPlayer.duration : time + 10
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
                    console.log('Bookmarks fetched IN youtubecontent:', obj)
                    if (chrome.runtime.lastError) {
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

    const newVideoLoaded = async () => {

        console.log('New video loaded:', newAudioLoadedExecutedTimes)

        newAudioLoadedExecutedTimes++

        spotifyPlayer = {
            progressBar: document.querySelectorAll(curProgressBarQueryBig)[0],
            audioPLayerCurrentTime: document.querySelectorAll(audioPLayerCurrentTimeElement)[0],
            playButton: document.querySelectorAll(playButtonElement)[0],
            durationElement: getDuration(),
            fullTitle: getFullTitle(),
            get duration() {
                return this.durationElement ? getSeconds(this.durationElement.textContent) : 0
            },
            set duration(value) {
                _duration = value
            },
            get title() {
                return this.fullTitle
            },
            set title(value) {
                _title = value
            },
            get playState() {
                return this.playButton ? this.playButton.getAttribute('aria-label') === "PLay" ? true : false : 0
            },
            set playState(value) {
                _playState = value
            },
            get currentTime() {
                return this.audioPLayerCurrentTime ? getSeconds(this.audioPLayerCurrentTime.textContent) : 0
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

        const bookmarks = await fetchBookmarks(currentVideoId)
        
        console.log('Sotify player:', spotifyPlayer.duration)

        newAudioLoadedExecutedTimes === 1 && addBookmarkButton()
        // clearBookmarksOnProgressBar() 
        // if (bookmarks.length > 0) {
            addBookmarksOnProgressBar(bookmarks)
        // }
        addResizeObserver()
        newAudioLoadedExecutedTimes--
    }

    const bookmarkClickEventHandler = async (buttonClass) => {
        console.log('Bookmark button clicked', spotifyPlayer.playState)
        const currentTime = spotifyPlayer.currentTime
        spotifyPlayer.playState && spotifyPlayer.play(currentTime)
        
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

        await chrome.storage.local.set({ taskStatus: true }, () => {
            console.log('Task status set to started');
        });
        chrome.runtime.sendMessage({ type: "CREATING_BOOKMARK" })
        
        const currAudioTitle = spotifyPlayer.title
        const newBookmark = {
            id: currentVideoId,
            urlTemplate: 'https://open.spotify.com/',
            time: currentTime,
            title: currAudioTitle,
            bookMarkCaption: currAudioTitle,
            color: 'bg-green-600'
        }

        await chrome.storage.sync.set({[currentVideoId]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a,b) => a.time - b.time))}, async () => {
            await newVideoLoaded()
            console.log('Bookmark added from dzencontent.js:', newBookmark)
        })
        await chrome.storage.local.set({ taskStatus: false }, () => {
            console.log('Task status set to completed');
        });
        chrome.runtime.sendMessage({ type: "STOP_CREATING_BOOKMARK"})
    }


    const spotifyOnMessageListener = (obj) => {
        const { type, value, videoId } = obj
        currentVideoId = videoId
        if (currentVideoId === 'spotify') {
            let idElement = document.querySelectorAll('a[data-testid="context-item-link"]')[0]
            if (idElement) {
                idElement = idElement.href.toString().replace('https://open.spotify.com/', '')
                if (idElement.includes('album')) {
                    idElement += `/${idElement.textContent.replaceAll(' ', '_' )}`
                }
            } else {
                idElement = ''
            }
            currentVideoId = idElement
            if (currentVideoId === '') {
                const observer = new MutationObserver((mutations, observer) => {
                    const idElement = document.querySelectorAll('a[data-testid="context-item-link"]')[0]
                    console.log('Mutation observer:', idElement)
                    if (checkForElement(idElement)) {
                        console.log('Element found:', idElement)
                        observer.disconnect();
                    }
                });
            
                observer.observe(document.body, { childList: true, subtree: true });
                return
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
        handleFetchBookmarks().then(
            (currentVideoBookmarks) => {
                if (type === 'NEW') {
                    const handleNewVideoLoaded = async () => {
                        await chrome.storage.local.set({ taskStatus: false }, async () => {
                            await newVideoLoaded('NEW')
                            console.log('Task status set to false');
                        });
                    }
                    handleNewVideoLoaded().catch(error => {
                        const nativeMessage = 'Error handling new video:'
                        errorHandler(error, nativeMessage)
                    })
                } else if (type === 'PLAY') {
                    spotifyPlayer.currentTime = value
                    console.log('Play bookmark:', spotifyPlayer, value)
                    spotifyPlayer.play(value)
                } else if (type === 'DELETE') {
                    console.log('Delete bookmarks:', value, currentVideoBookmarks)
                    currentVideoBookmarks = currentVideoBookmarks.filter(bookmark => !value.includes(bookmark.time))
                    const handleDeleteBookmark = async () => {
                        await chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, async () => {
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
                        await chrome.storage.sync.set({[currentVideoId]: JSON.stringify(currentVideoBookmarks)}, async () => {
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
            const nativeMessage = 'Error fetching bookmarks:'
            errorHandler(error, nativeMessage)
        })
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


