import { AnimatePresence, motion } from 'framer-motion';
import './App.css'
import Bookmark from './components/Bookmark';

import { 
  localizeContent, 
  VideoElementInfo,
  openVideo,
  onPlay,
  onDelete,
} from './utils'
import { useEffect } from 'react'
import useChromeApi from './context/useChromeApi';


function App() {

  const { curTab, curSession, curVideosWithBookmarks, allowedUrls } = useChromeApi()

  useEffect(() => {
    localizeContent()
  }
  , [])

  const handleVideoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const video = JSON.parse(e.target.value)
    openVideo(video)
  }

  const handleBookmarkPLay = async (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
    e.preventDefault();
    e.stopPropagation();
    await onPlay(curTab, bookmark.time, bookmark.id)
  }

  const handleBookmarkDelete = async (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('DELETE BOOKMARK:', bookmark)
    onDelete(curTab, bookmark.time, bookmark.id)
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
              <AnimatePresence>
                {curVideosWithBookmarks[curSession].map((bookmark, i) => {
                  console.log('BOOKMARK:', bookmark)
                  return (
                    <motion.div 
                      key={`'bookmark-'-${i}-${bookmark.time}`}
                      id={`'bookmark-'-${i}-${bookmark.time}`}
                      className="w-full h-auto py-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Bookmark 
                        bookmark={bookmark} 
                        curTab={curTab} 
                        handleBookmarkPLay={handleBookmarkPLay}
                        handleBookmarkDelete={handleBookmarkDelete}
                      />
                    </motion.div>
                  )
                })}
                </AnimatePresence>
                :
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
