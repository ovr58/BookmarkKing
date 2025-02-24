import './App.css'
import Bookmark from './components/Bookmark';

import { 
  getCurrentTab, 
  localizeContent, 
  getUrlParams,
  getSpotifyVideoId,
  fetchVideosWithBookmarks,
  VideoElementInfo,
  openVideo,
  getAllowedUrls,
  ActiveTab,
} from './utils'
import { useCallback, useEffect, useMemo, useState } from 'react'


function App() {

  const allowedUrls = useMemo(() => getAllowedUrls(), [])

  const [curVideosWithBookmarks, setcurVideosWithBookmarks] = useState<{ [key: string]: VideoElementInfo[] | [] }>({ ['unavailable']: [] })

  const [curSession, setcurSession] = useState('')

  const [curTab, setCurTab] = useState({ url: '', id: 0 })

  const fetchCurTab = useCallback(async () => {
    try {
      const tab = await getCurrentTab()
      console.log('CUR TAB CALL', tab)
      return { id: tab.id ?? 0, url: tab.url ?? '' }
    } catch (error) {
      console.error('Error:', error)
      return { url: '', id: 0 }
    }
  }, [])

  const fetchCurSession = useCallback(async (tab: ActiveTab): Promise<string> => {
    console.log('CUR SESSION CALL', tab)
    console.log('POPUP - ALLOWED URLS:', allowedUrls, allowedUrls.some(element => tab.url.includes(element)))

    let urlParams = getUrlParams(tab.url, allowedUrls)
    try {
      if (urlParams === 'spotify') {
        const spotifyVideoId = await getSpotifyVideoId({ ...tab, id: tab.id })
        urlParams = spotifyVideoId ? spotifyVideoId : ''
        console.log('POPUP - Spotify Video Id:', urlParams)
        urlParams = urlParams.replace('https://open.spotify.com/', '')
      }
      console.log('POPUP - BOOKMARKS:', urlParams)
    } catch (error) {
      console.error('Error:', error)
    }
    return urlParams
  }, [allowedUrls])

  const fetchVideos = useCallback(async () => {
    console.log('CURR VIDEOS WITH BOOKMARKS CALL')
    const videos = await fetchVideosWithBookmarks()
    return videos
  }, [])

  useEffect(() => {
    fetchCurTab().then((tab) => {
      console.log('TAB', tab)
      setCurTab(tab)
      fetchCurSession(tab).then((session) => {
        console.log('SESSION', session)
        setcurSession(session)
        fetchVideos().then((videos) => {
          const typedVideos = videos as { [key: string]: VideoElementInfo[] | [] };
          if (Object.keys(typedVideos).length === 0 || !Object.keys(typedVideos).includes(session)) {
            typedVideos[session] = []
          }
          if (typedVideos[session] && typedVideos[session].length === 0) {
            typedVideos[session] = []
          }

          console.log('VIDEOS', typedVideos)

          setcurVideosWithBookmarks(typedVideos)
          localizeContent()
        })
      })
    })
  }, [fetchVideos, fetchCurSession, fetchCurTab, curTab.id])

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
              <div id="videos" className="videoslist">
                <span className="title" data-i18n="videosSelectTitle"></span>
                <select
                 id="dropdown" 
                 className="videosSelect" 
                 i18n-title="videosSelectTitle"
                 onChange={(e) => handleVideoChange(e)}
                >
                  {Object.keys(curVideosWithBookmarks).map((videoKey) => {
                    console.log('VIDEO FROM LIST RENDER:', videoKey)
                    if (videoKey === curSession && curVideosWithBookmarks[videoKey].length === 0) {
                      return (
                        <option 
                          key='placeholder'
                          id='placeholder'
                          className = 'videoTitle'
                          value=''
                          selected={true}
                        >
                          {
                            videoKey !== 'technical' && videoKey !== 'unavailable' ?
                              chrome.i18n.getMessage('currentVideo') :
                              chrome.i18n.getMessage('openVideoMessage')
                          }
                        </option>
                      )
                    } else if (curVideosWithBookmarks[videoKey].length > 0) {
                      return (
                        <option 
                          key={`'video-' + ${curVideosWithBookmarks[videoKey][0].id}`}
                          id={`'video-' + ${curVideosWithBookmarks[videoKey][0].id}`}
                          className = 'videoTitle'
                          value={JSON.stringify(curVideosWithBookmarks[videoKey][0])}
                          selected={curVideosWithBookmarks[videoKey][0].id === curSession}
                        >
                          {curVideosWithBookmarks[videoKey][0].title}
                        </option>
                      )
                    }
                  })}
                </select>
              </div>
            <div id="listTitle" className="title">
              {allowedUrls.some(element => curTab.url.includes(element)) ?
                `${chrome.i18n.getMessage('extentionTitle')}` :
                
                `${chrome.i18n.getMessage('extensionDescription')}`
              }
            </div>
            <div className="bookmarks" id="bookmarks">
              {curVideosWithBookmarks[curSession] && curVideosWithBookmarks[curSession].length > 0 ? 
                curVideosWithBookmarks[curSession].map((bookmark, i) => {
                  console.log('BOOKMARK:', bookmark)
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
