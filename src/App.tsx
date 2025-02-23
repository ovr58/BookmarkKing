import './App.css'
import Bookmark from './components/Bookmark';

import { 
  getCurrentTab, 
  localizeContent, 
  getUrlParams,
  getSpotifyVideoId,
  fetchBookmarks,
  fetchVideosWithBookmarks,
  VideoElementInfo,
  openVideo,
  getAllowedUrls,
  BookmarkType,
} from './utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


const port = chrome.runtime.connect({ name: 'popup' })

const portListener = () => {
  console.log('POPUP - PORT MESSAGE')
  App()
  port.disconnect()
}

if (!port.onMessage.hasListener(portListener)) {
  port.onMessage.addListener(portListener)
}

function App() {

  const videoElementInfo = useMemo(() => ({
    id: '',
    class: '',
    title: '',
    urlTemplate: '',
    rect: {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
    },
    duration: 0,
    bookmarks: [] as BookmarkType[]
  })
  , [])

  const curVideosWithBookmarks = useRef([] as VideoElementInfo[][]) as React.MutableRefObject<VideoElementInfo[][]>

  const curSession = useRef(videoElementInfo) as React.MutableRefObject<VideoElementInfo>

  const [curTab, setCurTab] = useState({ url: '', id: 0 })

  const fetchCurTab = useCallback(async () => {
    console.log('CUR TAB CALL')
    try {
      const tab = await getCurrentTab()
      return { id: tab.id ?? 0, url: tab.url ?? '' }
    } catch (error) {
      console.error('Error:', error)
      return { url: '', id: 0 }
    }
  }, [])

  const fetchCurSession = useCallback(async (): Promise<VideoElementInfo> => {
    console.log('CUR SESSION CALL')
    const tab = await fetchCurTab()
    try {
      const allowedUrls: RegExp = getAllowedUrls() as RegExp
      console.log('POPUP - ALLOWED URLS:', allowedUrls)
      if (tab.url && tab && tab.id !== undefined) {
        let urlParams = getUrlParams(tab.url, allowedUrls)
        if (urlParams === 'spotify') {
        const spotifyVideoId = await getSpotifyVideoId({ ...tab, id: tab.id })
        urlParams = spotifyVideoId ? spotifyVideoId : ''
        console.log('POPUP - Spotify Video Id:', urlParams)
        urlParams = urlParams.replace('https://open.spotify.com/', '')
        } else {
        urlParams = ''
        }
        const videoBookmarks = await fetchBookmarks(urlParams)
        console.log('POPUP - BOOKMARKS:', videoBookmarks)
        return  {
        ...videoElementInfo,
        id: urlParams,
        bookmarks: videoBookmarks as BookmarkType[]
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
    return videoElementInfo
  }, [videoElementInfo, fetchCurTab])

  const fetchVideos = useCallback(async () => {
    console.log('CURR VIDEOS WITH BOOKMARKS CALL')
    const tab = await fetchCurTab()
    curSession.current = await fetchCurSession()
    const id = curSession.current.id
    const videos = await fetchVideosWithBookmarks(id)
    curVideosWithBookmarks.current = videos
    console.log('POPUP - Videos:', curVideosWithBookmarks.current)
    return tab
  }, [fetchCurTab, fetchCurSession])

  useEffect(() => {
    fetchVideos().then((tab) => {
      if (tab.id !== curTab.id) {
        setCurTab(tab)
      }
    })
    localizeContent()
  }, [fetchVideos, curTab.id])

  const handleVideoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const video = JSON.parse(e.target.value)
    openVideo(video)
  }
  
  return (
    <>
      <div id="extensionName" className="title">
        <span data-i18n="extensionName"></span>
      </div>
      <div id="container" className="container">
          <div>
            {
              curVideosWithBookmarks.current.length > 0 && 
              <div id="videos" className="videoslist">
                <span className="title" data-i18n="videosSelectTitle"></span>
                <select
                 id="dropdown" 
                 className="videosSelect" 
                 i18n-title="videosSelectTitle"
                 onChange={(e) => handleVideoChange(e)}
                >
                  {curVideosWithBookmarks.current.map((video) => {
                    return (
                      <option 
                        key={`'video-' + ${video[0].id}`}
                        id={`'video-' + ${video[0].id}`}
                        className = 'videoTitle'
                        value={JSON.stringify(video[0])}
                        selected={video[0].id === curSession.current.id}
                      >
                        {video[0].title}
                      </option>
                    )
                  })}
                  {curSession.current.id === '' && 
                  <option 
                    key='placeholder'
                    value="" 
                    className="videoTitle" 
                    selected
                    disabled
                  >
                    {
                      (() => {
                        try {
                          return chrome.i18n.getMessage('openVideoMessage')
                        } catch (error) {
                          return 'Open Video'
                        }
                      })()
                    }
                  </option>
                  }
                </select>
              </div>
            }
            <div id="listTitle" className="title">
              {getAllowedUrls().test(curTab.url) ?
                `${chrome.i18n.getMessage('extentionTitle')}` :
                
                `${chrome.i18n.getMessage('extensionDescription')}`
              }
            </div>
            <div className="bookmarks" id="bookmarks">
              {curSession.current.bookmarks.length > 0 ? 
                curSession.current.bookmarks.map((bookmark, i) => {
                  return (
                    <div 
                      key={`'bookmark-'-${i}-${bookmark.time}`}
                      id={`'bookmark-'-${i}-${bookmark.time}`}
                      className="w-full h-auto py-3"
                    >
                      {<Bookmark bookmark={bookmark} curTab={curTab} />}
                    </div>
                  )
                }) :
                <div className="bookmark">
                  <div className="bookmarkTitle">
                    {
                      (() => {
                        try {
                          return chrome.i18n.getMessage('noBookmarks')
                        } catch (error) {
                          return 'No Bookmarks'
                        }
                      })()
                    }
                  </div>
                </div>
              }
            </div>
          </div>
      </div>
    </>
  )
}

export default App
