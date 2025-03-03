import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import Bookmark from './Bookmark'
import { onPlay, VideoElementInfo } from '../utils'
import UiContainer from './UiContainer';

interface BookmarksContainerProps {
  curSessionVideos: VideoElementInfo[];
  curTab: { url: string; id: number; };
}

const BookmarksContainer: React.FC<BookmarksContainerProps> = ({ curSessionVideos, curTab }) => {

    const [bookmarkState, setBookmarkState] = useState<{ [key: string]: {isOpen: boolean, isSelected: boolean} }>(
        Object.fromEntries(curSessionVideos.map(video => [
          video.time.toString(), 
          {
            isOpen: true,
            isSelected: false
          }
        ]))
      );

    const handleBookmarkPLay = async (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
        e.preventDefault();
        e.stopPropagation();
        await onPlay(curTab, bookmark.time, bookmark.id)
      }
    
    // const handleBookmarkDelete = async (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
    // e.preventDefault();
    // e.stopPropagation();
    // console.log('DELETE BOOKMARK:', bookmark)
    // onDelete(curTab, bookmark.time, bookmark.id)
    // }
      
  return (
    <AnimatePresence>
      <UiContainer bookmarkState={bookmarkState} setBookmarkState={setBookmarkState} />
        {curSessionVideos.map((bookmark, i) => {
            console.log('BOOKMARK:', bookmark)
            return (
            <motion.div 
                key={`'bookmark-'-${i}-${bookmark.time}`}
                id={`'bookmark-'-${i}-${bookmark.time}`}
                className="w-full h-auto mb-2 max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg overflow-hidden"
                initial={{ opacity: 1, height: '24px' }}
                animate={{ height: bookmarkState[bookmark.time.toString()].isOpen ? 'auto' : '24px'}}
                exit={{ opacity: 0, height: '1px' }}
                transition={{ duration: 0.5 }}
            >
                <Bookmark 
                    bookmark={bookmark} 
                    curTab={curTab}
                    bookmarkState={bookmarkState}
                    setBookmarkState={setBookmarkState} 
                    handleBookmarkPLay={handleBookmarkPLay}
                    // handleBookmarkDelete={handleBookmarkDelete}
                />
            </motion.div>
            )
        })}
    </AnimatePresence>
  )
}

export default BookmarksContainer