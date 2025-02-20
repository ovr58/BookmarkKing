import './App.css'
import Bookmark from './components/Bookmark';

import { 
  getCurrentTab, 
  localizeContent, 
  fetchAllowedUrls, 
  getUrlParams,
  getSpotifyVideoId,
  fetchBookmarks,
  fetchVideosWithBookmarks,
  VideoElementInfo,
  openVideo,
  ActiveTab
} from './utils'
import { useEffect, useMemo, useRef, useState } from 'react'

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
    bookmarks: [] as { 
      id: string; 
      time: number;
      urlTemplate?: string;
      title: string; 
      bookMarkCaption: string
    }[]
  })
  , [])

  const curVideosWithBookmarks = useRef([] as VideoElementInfo[][]) as React.MutableRefObject<VideoElementInfo[][]>

  const curSession = useRef(videoElementInfo) as React.MutableRefObject<VideoElementInfo>

  const curTab = useRef({ url: '', id: 0 }) as React.MutableRefObject<ActiveTab>

  const [listTitle, setListTitle] = useState('')

  // const [videos, setVideos] = useState<VideoElementInfo[][]>([])

  // const [currentSessionTab, setCurrSessionTab] = useState<ActiveTab>({ url: '', id: 0 })

  
  const currentTab = useMemo(async () => {
    
  }, [])

  
  useEffect(() => {
    const fetchCurTab = async () => {
      try {
        const tab = await getCurrentTab()
        curTab.current = { id: tab.id ?? 0, url: tab.url ?? '' }
        return curTab.current
      } catch (error) {
        console.error('Error:', error)
        return { url: '', id: 0 }
      }
    }
    const fetchCurSession = async () => {
      console.log('CUR SESSION CALL')
      const tab = await fetchCurTab()
      try {
        const allowedUrls: string[] | '' = await fetchAllowedUrls() as string[] | ''
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
          return  {
            ...videoElementInfo,
            id: urlParams,
            bookmarks: videoBookmarks as {
              id: string;
              time: number;
              urlTemplate?: string;
              title: string;
              bookMarkCaption: string;
            }[]
          }
        }
      } catch (error) {
        console.error('Error:', error)
      }
      return videoElementInfo
    }
    const fetchVideos = async () => {
      console.log('CURR VIDEOS WITH BOOKMARKS CALL')
      curSession.current = await fetchCurSession()
      const id = curSession.current.id
      const videos = await fetchVideosWithBookmarks(id)
      console.log('POPUP - Videos:', videos)
      curVideosWithBookmarks.current = videos
    }
    fetchVideos()
  }, [currentTab, videoElementInfo])
  
  useEffect(() => {
    console.log('POPUP - Fetch Data')
    const fetchData = async () => {
      try {
        localizeContent()
        const tab = await currentTab;
        if (tab.url === '') {
          return
        }
        // const curVideoElement = await currSession
        // const videos = await curVideosWithBookmarks
        if (tab.url.includes('youtube.com/watch') || /vk(video\.ru|\.com)\/video/.test(tab.url) || tab.url.includes('dzen.ru') || tab.url.includes('open.spotify.com')) {
          setListTitle(chrome.i18n.getMessage('extentionTitle'))
        } else {
          setListTitle(chrome.i18n.getMessage('extensionDescription'))
        }
        // setVideoELement(curVideoElement)
        // setVideos(videos)
        // setCurrSessionTab(tab)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchData()
  }, [currentTab])

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
                        selected={video[0].id === videoElementInfo.id}
                      >
                        {video[0].title}
                      </option>
                    )
                  })}
                  {videoElementInfo.id === '' && 
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
              {listTitle}
            </div>
            <div className="bookmarks" id="bookmarks">
              {videoElementInfo.bookmarks.length > 0 ? 
                videoElementInfo.bookmarks.map((bookmark, i) => {
                  return (
                    <div 
                      key={`'bookmark-'-${i}-${bookmark.time}`}
                      id={`'bookmark-'-${i}-${bookmark.time}`}
                      className="w-full h-auto py-3"
                    >
                      {<Bookmark bookmark={bookmark} currTab={currentTab} />}
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
