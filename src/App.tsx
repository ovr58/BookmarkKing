import './App.css'

import { 
  getCurrentTab, 
  localizeContent, 
  fetchAllowedUrls, 
  getUrlParams,
  getSpotifyVideoId,
  fetchBookmarks,
  fetchVideosWithBookmarks,
  VideoElementInfo
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

  const currSesion = useCallback(async () => {
    try {
      const currentTab = await getCurrentTab()
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

  const curVideosWithBookmarks = async (id: string) => {
    const videos = await fetchVideosWithBookmarks(id)
    console.log('POPUP - Videos:', videos)
    return videos
  }

  const [videos, setVideos] = useState<VideoElementInfo[]>([])

  const [prevVideoId, setPrevVideoId] = useState('')
  

  useEffect(() => {
    localizeContent()
    curVideosWithBookmarks(videoElementInfo.id).then(async (videos) => {
      return currSesion().then((videoElementInfo) => {
        return {videos, videoElementInfo}
      })
    }).then(({videos, videoElementInfo}) => {
      setVideos(videos)
      setVideoELement(videoElementInfo)
    }).catch((error) => {
      console.error('Error:', error)
    })
  }, [])
  
  return (
    <>
      <div id="extensionName" className="title">
        <span data-i18n="extensionName"></span>
      </div>
      <div id="container" className="container">
          <div>
            {
              videoElementInfo.bookmarks.length > 0 && 
              <div id="videos" className="videoslist">
                <span className="title" data-i18n="videosSelectTitle"></span>
                <select id="dropdown" className="videosSelect" i18n-title="videosSelectTitle">
                  {videoElementInfo.bookmarks.map((bookmark, index) => {
                    return (
                      <option 
                        key={index} value={bookmark.id}>{bookmark.title}</option>
                    )
                  })}
                </select>
              </div>}
              <div id="setUpListContainer" className="setUpButtonContainer">
                  
              </div>
              <div id="sliderContainer" className="sliderContainer">

              </div>
              <div id="listTitle" className="title"></div>
              <div className="bookmarks" id="bookmarks"></div>
          </div>
      </div>
    </>
  )
}

export default App
