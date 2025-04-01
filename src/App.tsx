import './App.css'

import { 
  localizeContent, 
  openVideo,
} from './utils'
import { useCallback, useEffect } from 'react'
import useChromeApi from './hooks/useChromeApi';
import BookmarksContainer from './components/BookmarksContainer';
import ThemeToggle from './components/ThemeToggle';
import useTheme from './hooks/useTheme';
import { useTagsMenu } from './hooks/useTagsMenu';

function App() {

  const { curTab, curSession, curVideosWithBookmarks, allowedUrls } = useChromeApi()


  const { setTagMenu } = useTagsMenu()

  const curTheme = useTheme()

  useEffect(() => {

    document.body.setAttribute('data-mode', curTheme)

    localizeContent()
  }
  , [curTheme])

  const handleVideoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const video = JSON.parse(e.target.value)
    openVideo(video)
  }

  const handleTagsMenu = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('TAG MENU OPENED')
      setTagMenu([], { x: e.clientX, y: e.clientY });
    }, [setTagMenu]);

  return (
    <>
      <div id="extensionName" className="flex justify-between items-center p-2">
        <span data-i18n="extensionName" className='text-dark dark:text-light'></span>
        
        <ThemeToggle />
        
      </div>
      <div id="container" className="container" onContextMenu={(e) => {
        e.preventDefault()
        handleTagsMenu(e)
      }}>
          <div>
              <div id="videos" className="videoslist">
                <span className="font-bold text-[14px] p-2 text-dark dark:text-light" data-i18n="videosSelectTitle"></span>
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
            <div id="listTitle" className="font-bold text-[14px] p-2 text-dark dark:text-light">
              {allowedUrls.some(element => curTab.url.includes(element)) ?
                `${chrome.i18n.getMessage('extentionTitle')}` :
                
                `${chrome.i18n.getMessage('extensionDescription')}`
              }
            </div>
            <div className="block" id="bookmarks">
              {curVideosWithBookmarks[curSession] && curVideosWithBookmarks[curSession].length > 0 ? 
                <BookmarksContainer 
                  uiSetup={[1, 1, 1, 1]}
                  curSessionVideo={curVideosWithBookmarks[curSession]} 
                  curTab={curTab}
                />
                :
                <div className="w-full h-full">
                  <BookmarksContainer 
                    uiSetup={[1, 0, 0, 0]}
                    curSessionVideo={[
                      {
                        id: curSession,
                        time: 0,
                        title: '',
                        color: 'gray',
                        class: 'default-class',
                        rect: { width: 0, height: 0, top: 0, left: 0 },
                        duration: 0,
                        bookMarkCaption: chrome.i18n.getMessage('addFirstBookmark')
                      }
                    ]} 
                    curTab={curTab}
                  />
                  <div className="font-normal italic text-[12px] p-2 text-dark dark:text-light">
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
