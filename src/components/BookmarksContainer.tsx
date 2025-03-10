import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import Bookmark from './Bookmark'
import { onDelete, onPlay, onUpdate, showConfirmationNotification, VideoElementInfo } from '../utils'
import UiContainer from './UiContainer';

interface BookmarksContainerProps {
  curSessionVideo: VideoElementInfo[];
  curTab: { url: string; id: number; };
}

const BookmarksContainer: React.FC<BookmarksContainerProps> = ({ curSessionVideo, curTab }) => {

    const [bookmarkState, setBookmarkState] = useState<{ [key: string]: {isOpen: boolean, isSelected: boolean, color: string} }>(
        {...Object.fromEntries(curSessionVideo.map(bookmark => [
          bookmark.time.toString(), 
          {
            isOpen: true,
            isSelected: false,
            color: bookmark.color
          }
        ]))}
      );

    const [sortType, setSortType] = useState<'color' | 'timedisc' | 'timeasc'>('timeasc')

    const curSessionVideoSorted = curSessionVideo.sort((a, b) => {
      if (sortType === 'timeasc') {
        return a.time - b.time
      } else if (sortType === 'timedisc') {
        return b.time - a.time
      } else {
        return a.color.localeCompare(b.color)
      }
    }
    )

    const handleBookmarkPLay = async (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
        e.preventDefault();
        e.stopPropagation();
        await onPlay(curTab, bookmark.time, bookmark.id)
      }
    
    const handleBookmarkDelete = () => {
      const bookmarksToDelete = curSessionVideo.filter(bookmark => bookmarkState[bookmark.time.toString()].isSelected)
      if (bookmarksToDelete.length === 0) return
      showConfirmationNotification(
        () => onDelete(curTab, bookmarksToDelete)
      );
    }

    const handleColorChange = (color: string) => {
      console.log('Color Change', color)
      const bookmarksToChange = curSessionVideo.filter(bookmark => bookmarkState[bookmark.time.toString()].isSelected)
      bookmarksToChange.forEach(bookmark => {
        bookmark.color = color
      })
      console.log('Bookmarks to Change:', bookmarksToChange)
      if (bookmarksToChange.length === 0) return
      onUpdate(curTab, bookmarksToChange)
    }
      
  return (
    <AnimatePresence>
      <UiContainer 
        bookmarkState={bookmarkState} 
        setBookmarkState={setBookmarkState}
        handleDelete={handleBookmarkDelete}
        handleColorChange={handleColorChange}
        setSortType={setSortType} 
      />
      {curSessionVideoSorted.map((bookmark, i) => {
          console.log('BOOKMARK:', bookmark)
          return (
          <motion.div 
              key={`'bookmark-'-${i}-${bookmark.time}`}
              id={`'bookmark-'-${i}-${bookmark.time}`}
              className="w-full h-auto mb-2 max-w-2xl mx-auto bg-light dark:bg-primaryDark shadow-lg border-solid border-gray-500 border-2 border-b-4 dark:border-none rounded-lg overflow-hidden"
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
              />
          </motion.div>
          )
      })}
    </AnimatePresence>
  )
}

export default BookmarksContainer