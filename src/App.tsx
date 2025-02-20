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
import { useCallback, useEffect, useState } from 'react'

function App() {

  const [videoElementInfo, setVideoELement] = useState({
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

  const [listTitle, setListTitle] = useState('')

  const [videos, setVideos] = useState<VideoElementInfo[][]>([])

  const currTab = useCallback(async () => {
    try {
      const currentTab = await getCurrentTab()
      return currentTab as ActiveTab
    } catch (error) {
      console.error('Error:', error)
      return { url: '', id: 0 } as ActiveTab
    }
  }, [])

  const currSesion = useCallback(async (currentTab: ActiveTab) => {
    try {
      const allowedUrls: string[] | '' = await fetchAllowedUrls() as string[] | ''
      if (currentTab.url && currentTab && currentTab.id !== undefined) {
        let urlParams = getUrlParams(currentTab.url, allowedUrls)
        if (urlParams === 'spotify') {
          const spotifyVideoId = await getSpotifyVideoId({ ...currentTab, id: currentTab.id })
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
  }, [videoElementInfo])

  const curVideosWithBookmarks = useCallback(async (id: string) => {
    const videos = await fetchVideosWithBookmarks(id)
    console.log('POPUP - Videos:', videos)
    return videos
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        localizeContent()
        const currentTab = await currTab()
        if (currentTab.url === '') {
          return
        }
        const videoElementInfo = await currSesion(currentTab)
        const videos = await curVideosWithBookmarks(videoElementInfo.id)
        if (currentTab.url.includes('youtube.com/watch') || /vk(video\.ru|\.com)\/video/.test(currentTab.url) || currentTab.url.includes('dzen.ru') || currentTab.url.includes('open.spotify.com')) {
          setListTitle(chrome.i18n.getMessage('extentionTitle'))
        } else {
          setListTitle(chrome.i18n.getMessage('extentionTitle'))
        }
        setVideos(videos)
        setVideoELement(videoElementInfo)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchData()
  }, [currTab, curVideosWithBookmarks, currSesion, videoElementInfo.id])

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
              videos.length > 0 && 
              <div id="videos" className="videoslist">
                <span className="title" data-i18n="videosSelectTitle"></span>
                <select
                 id="dropdown" 
                 className="videosSelect" 
                 i18n-title="videosSelectTitle"
                 onChange={(e) => handleVideoChange(e)}
                >
                  {videos.map((video) => {
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
                  {!videoElementInfo.id && 
                  <option 
                    key='placeholder'
                    value="" 
                    className="videoTitle" 
                    selected
                    disabled
                  >
                    {chrome.i18n.getMessage('openVideoMessage')}
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
                      className="bookmark"
                    >
                      <Bookmark bookmark={bookmark} />
                    </div>
                  )
                }) :
                <div className="bookmark">
                  <div className="bookmarkTitle">
                    {chrome.i18n.getMessage('noBookmarks')}
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
