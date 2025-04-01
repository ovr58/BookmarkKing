import '../App.css'

import { useEffect, useState } from 'react'
import { localizeContent, VideoElementInfo } from '../utils';
import useTheme from '../hooks/useTheme';
import BookmarksContainer from './BookmarksContainer';
import useChromeApi from '../hooks/useChromeApi';

function SidePanel() {

  const [bookmarks, setBookmarks] = useState<VideoElementInfo[]>([])
  const { curTab } = useChromeApi()
  const curTheme = useTheme()

  useEffect(() => {

    document.body.setAttribute('data-mode', curTheme)

    const getBookmarks = async () => {
      const { bookmarks } = await chrome.storage.local.get('bookmarks')
      setBookmarks(bookmarks)
    }
    localizeContent()
    getBookmarks()
  }
  , [curTheme])

  return (
    <>
      <div id="sidePanelName" className="flex justify-between items-center p-2">
        <span data-i18n="sidePanelName" className='text-dark dark:text-light'></span>
      </div>
      <div id="sideContainer" className="container">
          <div>
            <div className="block" id="bookmarks">
                {bookmarks.length > 0 && 
                <BookmarksContainer 
                  uiSetup={[1, 1, 0, 0]}
                  curSessionVideo={bookmarks}
                  curTab={curTab}
                />}
            </div>
          </div>
      </div>
    </>
  )
}

export default SidePanel