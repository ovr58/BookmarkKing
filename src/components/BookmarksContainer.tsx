import { AnimatePresence, motion } from 'motion/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Bookmark from './Bookmark'
import { onDelete, onPlay, onUpdate, VideoElementInfo } from '../utils'
import UiContainer from './UiContainer';

interface BookmarksContainerProps {
  uiSetup: number[];
  curSessionVideo: VideoElementInfo[];
  curTab: { url: string; id: number; };
}

const BookmarksContainer: React.FC<BookmarksContainerProps> = ({ uiSetup, curSessionVideo, curTab }) => {

  const calcBookmarkState = useCallback((video: VideoElementInfo[]) => {
    return {...Object.fromEntries(video.map(bookmark => [
      bookmark.time.toString(), 
      {
        isOpen: true,
        isSelected: false,
        color: bookmark.color
      }
    ]))}
  }, []  
  )
  
  const bookmarkStateObject = useMemo(() => calcBookmarkState(curSessionVideo), [curSessionVideo, calcBookmarkState]
  )

  const [bookmarkState, setBookmarkState] = useState<{ [key: string]: {isOpen: boolean, isSelected: boolean, color: string} }>(
    bookmarkStateObject
  );

  useEffect(() => {
    setBookmarkState(bookmarkStateObject)
  }
  , [bookmarkStateObject])
  
  console.log('Bookmark State:', bookmarkState)

  const [sortedOrder, setSortOrder] = useState([true, false, false, false]);
  console.log('Sorted Order:', sortedOrder)
  const curSessionVideoSorted = useMemo(() => {
    return sortedOrder.filter(order => order === true).length === 1 ? curSessionVideo.sort((a, b) => {
        if (sortedOrder[0]) return a.time - b.time;
        if (sortedOrder[1]) return b.time - a.time;
        if (sortedOrder[2]) return a.color.localeCompare(b.color);
        if (sortedOrder[3]) return b.color.localeCompare(a.color);
        return a.time - b.time;
    }) : curSessionVideo.sort((a, b) => {
        if (sortedOrder[0] && sortedOrder[2]) {
            if (a.color === b.color) return a.time - b.time;
            return a.color.localeCompare(b.color);
        } else if (sortedOrder[0] && sortedOrder[3]) {
            if (a.color === b.color) return a.time - b.time;
            return b.color.localeCompare(a.color);
        } else if (sortedOrder[1] && sortedOrder[2]) {
            if (a.color === b.color) return b.time - a.time;
            return a.color.localeCompare(b.color);
        } else if (sortedOrder[1] && sortedOrder[3]) {
            if (a.color === b.color) return b.time - a.time;
            return b.color.localeCompare(a.color);
        }
        return a.time - b.time;
    });
  }, [curSessionVideo, sortedOrder]);

  const handleExpandByCommand = (commandKey: string) => {
    const color = commandKey.split('_')[1]
    const command = commandKey.split('_')[0]

    switch (command) {
      case 'expandAll':
        Object.keys(bookmarkState).forEach((key: string) => {
          bookmarkState[key].isOpen = true;
        });
        break;
      case 'inverseExpand':
        Object.keys(bookmarkState).forEach((key: string) => {         
          bookmarkState[key].isOpen = !bookmarkState[key].isOpen;
        })
        break;
      case 'collapseAll':
        Object.keys(bookmarkState).forEach((key: string) => {
          bookmarkState[key].isOpen = false;
        });
        break;
      case 'sameColor':
        Object.keys(bookmarkState).forEach((key: string) => {
          if (bookmarkState[key].color === color) {
            bookmarkState[key].isOpen = !bookmarkState[key].isOpen
          }
        });
        break;
      case 'collapseSelected':
        Object.keys(bookmarkState).forEach((key: string) => {
          if (bookmarkState[key].isSelected) {
            bookmarkState[key].isOpen = !bookmarkState[key].isOpen
          }
        })
        break;
      default:
        break;
    }
    setBookmarkState({...bookmarkState})
  }

  const handleSellectByCommand = (commandKey: string) => {
    const color = commandKey.split('_')[1]
    const command = commandKey.split('_')[0]
    
    switch (command) {
      case 'selectAll':
        Object.keys(bookmarkState).forEach((key: string) => {
          bookmarkState[key].isSelected = true;
        });
        break;
      case 'deselectAll':
        Object.keys(bookmarkState).forEach((key: string) => {
          bookmarkState[key].isSelected = false;
        });
        break;
      case 'invertSelection':
        Object.keys(bookmarkState).forEach((key: string) => {
          bookmarkState[key].isSelected = !bookmarkState[key].isSelected;
        });
        break;
      case 'sameColor':
        Object.keys(bookmarkState).forEach((key: string) => {
          if (bookmarkState[key].color === color) {
            bookmarkState[key].isSelected = !bookmarkState[key].isSelected
          }
        });
        break;
      default:
        break;
    }
    setBookmarkState({...bookmarkState})
  }

  const handleBookmarkPLay = async (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
    e.preventDefault();
    e.stopPropagation();
    await onPlay(curTab, bookmark.time, bookmark.id)
  }
  
  const handleBookmarkDelete = () => {
    const bookmarksToDelete = curSessionVideo.filter(bookmark => bookmarkState[bookmark.time.toString()].isSelected)
    if (bookmarksToDelete.length === 0) return
    onDelete(curTab, bookmarksToDelete)
  }

  const handleColorChange = (color: string) => {
    console.log('Color Change', color)
    const bookmarksToChange = curSessionVideo.filter(bookmark => bookmarkState[bookmark.time.toString()].isSelected)
    bookmarksToChange.forEach(bookmark => {
      bookmark.color = color
    })
    console.log('Bookmarks to Change:', bookmarksToChange)
    if (bookmarksToChange.length === 0) return
    onUpdate(curTab, bookmarksToChange, bookmarksToChange[0].id)
  }

  const handleAddBookmark = () => {
    onUpdate(curTab, [], curSessionVideo[0].id)
  }

  
  // const handleVideoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   const video = JSON.parse(e.target.value)
  //   openVideo(video)
  // }
      
  return (
    <>
    <UiContainer 
      uiSetup={uiSetup}
      bookmarkState={bookmarkState}
      handleExpandByCommand={handleExpandByCommand} 
      handleSellectByCommand={handleSellectByCommand}
      handleDelete={handleBookmarkDelete}
      handleColorChange={handleColorChange}
      handleAddBookmark={handleAddBookmark}
      sortedOrder={sortedOrder}
      setSortType={setSortOrder} 
    />
    <AnimatePresence key='bookmarks-animate-presence'>
      {curSessionVideoSorted.map((bookmark, i) => {
          console.log('BOOKMARK:', bookmark)
          return (
          <motion.div 
              key={`bookmark-${i}-${bookmark.time}`}
              id={`bookmark-${i}-${bookmark.time}`}
              className="w-full h-auto mb-2 max-w-2xl mx-auto bg-light dark:bg-primaryDark shadow-lg border-solid border-gray-500 border-2 border-b-4 dark:border-none rounded-xl overflow-hidden"
              initial={{ opacity: 1, height: '24px' }}
              animate={{ height: bookmarkState[bookmark.time.toString()] ? bookmarkState[bookmark.time.toString()].isOpen ? 'auto' : '24px' : '24px' }}
              exit={{ opacity: 0, height: '1px' }}
              transition={{ duration: 0.5 }}
          >
              {uiSetup[1] === 1 && 
                <Bookmark 
                    bookmark={bookmark} 
                    curTab={curTab}
                    bookmarkState={bookmarkState}
                    setBookmarkState={setBookmarkState} 
                    handleBookmarkPLay={handleBookmarkPLay}
                />
              }
          </motion.div>
          )
      })}
    </AnimatePresence>
    </>
  )
}

export default BookmarksContainer