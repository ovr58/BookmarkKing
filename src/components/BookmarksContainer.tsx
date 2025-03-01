import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import Bookmark from './Bookmark'
import { onPlay, VideoElementInfo } from '../utils'

interface BookmarksContainerProps {
  curSessionVideos: VideoElementInfo[];
  curTab: { url: string; id: number; };
}

const BookmarksContainer: React.FC<BookmarksContainerProps> = ({ curSessionVideos, curTab }) => {

    const [isOpen, setIsOpen] = useState<{ [key: number]: boolean }>(
        Object.fromEntries(curSessionVideos.map(video => [video.time, true]))
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
        {curSessionVideos.map((bookmark, i) => {
            console.log('BOOKMARK:', bookmark)
            return (
            <motion.div 
                key={`'bookmark-'-${i}-${bookmark.time}`}
                id={`'bookmark-'-${i}-${bookmark.time}`}
                className="w-full h-auto mb-2 max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg overflow-hidden"
                initial={{ opacity: 1, height: '24px' }}
                animate={{ height: isOpen[bookmark.time] ? 'auto' : '24px'}}
                exit={{ opacity: 0, height: '1px' }}
                transition={{ duration: 0.5 }}
            >
                <Bookmark 
                    bookmark={bookmark} 
                    curTab={curTab}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen} 
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