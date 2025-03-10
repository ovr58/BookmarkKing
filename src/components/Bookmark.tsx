import React, { useEffect, useState } from 'react';
import { ActiveTab, getTimestamp, onUpdate, VideoElementInfo } from '../utils';

import { HiPlayPause } from "react-icons/hi2";
import { GrRadialSelected } from "react-icons/gr";
import { MdExpandMore, MdEdit, MdEditOff, MdSave } from "react-icons/md";

import { motion } from 'framer-motion';


interface BookmarkProps {
    bookmark: VideoElementInfo,
    curTab: ActiveTab;
    bookmarkState: { [key: string]: {isOpen: boolean, isSelected: boolean, color: string} };
    setBookmarkState: React.Dispatch<React.SetStateAction<{ [key: string]: {isOpen: boolean, isSelected: boolean, color: string } }>>;
    handleBookmarkPLay: (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => void;
}

const Bookmark: React.FC<BookmarkProps> = ({ bookmark, curTab, bookmarkState, setBookmarkState, handleBookmarkPLay }) => {
    const [isExpanded, setExpand] = useState(false)

    const [isInputActive, setIsInputActive] = useState(false)

    const [caption, setCaption] = useState(bookmark.bookMarkCaption)

    const [expandedHeight, setExpandedHeight] = useState<string>('auto')

    const collapsedRef = React.useRef<HTMLDivElement>(null)

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCaption(e.target.value)
    }

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, bookmark: VideoElementInfo) => {
        if (e.key === 'Enter') {
            handleSave(bookmark)
        } else if (e.key === 'Escape') {
            setIsInputActive(false)
        }
    }

    const handleExpand = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (caption.length>140) {
            setExpand(!isExpanded)
        }
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
        e.stopPropagation()
        handleSave(bookmark)
    }

    const handleSave = (bookmark: VideoElementInfo) => {
        console.log('new caption', caption)
        let newCaption = caption
        // если caption пустая после замены всех пробелов на '' - делаем caption = bookmark.title
        if (newCaption.replace(/\s/g, '') === '') {
            setCaption(bookmark.title)
            newCaption = bookmark.title
        }
        const updatedBookmark = {
            ...bookmark,
            bookMarkCaption: newCaption
        }
        onUpdate(curTab, [updatedBookmark]).then(() => {
            setExpand(false)
            setExpandedHeight('auto')
            setIsInputActive(false)
            console.log('Message Sent')
        })
    }

    const handleBookmarkSelect = (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
        e.preventDefault()
        e.stopPropagation()
        const key = bookmark.time.toString()
        setBookmarkState(
            {...bookmarkState, [key]: {
                ...bookmarkState[key],
                isSelected: !bookmarkState[key].isSelected
            }}
        )
    }

    const handleBookmarkOpen = (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => {
        e.preventDefault()
        e.stopPropagation()
        const key = bookmark.time.toString()
        setBookmarkState(
            {...bookmarkState, [key]: {
                ...bookmarkState[key],
                isOpen: !bookmarkState[key].isOpen
            }}
        )
    }

    useEffect(() => {
        if (collapsedRef.current) {
            console.log(expandedHeight)
            if (expandedHeight === 'auto' && collapsedRef.current.clientHeight > 72) {
                setExpandedHeight(`${collapsedRef.current?.clientHeight}px`)
            }
        }
    }, [isExpanded, expandedHeight])
    
    return (
    <div className="px-1 py-1 relative z-auto" key={bookmark.time}>
        <div className="flex items-start z-20 relative">
            <div 
                className="flex-grow truncate" 
                onClick={(e) => handleBookmarkOpen(e, bookmark)}
                title={chrome.i18n.getMessage('expandToggle')}
            >
                <div className="w-full cursor-pointer select-none justify-between items-center mb-3 pl-2" key="time-and-title">
                    <h2 className="text-md leading-snug font-extrabold text-componentDark dark:text-component truncate mb-1">{`${getTimestamp(bookmark.time)} > ${bookmark.title}`}</h2>
                </div>
                <motion.div
                    key="caption-motion"
                    initial={{ height: 'auto' }}
                    animate={{ height: isExpanded ? expandedHeight : '48px' }}
                    transition={{ duration: 0.3 }}
                >
                <div ref={collapsedRef} className="flex items-end justify-between whitespace-normal w-full h-auto pl-[12px] pr-[3px] gap-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <div className="relative text-componentDark dark:text-component w-full" style={{ height: isExpanded ? expandedHeight : '48px', alignContent: 'center'}} key="caption-container">
                        {isInputActive ? 
                        <textarea 
                            className="bg-primary dark:bg-primaryDark text-componentDark dark:text-component w-full h-full border-0 outline-none overflow-y-auto rounded-lg focus:ring-2 focus:border-2 focus:border-dark dark:focus:border-light focus:rounded-md whitespace-normal resize-none custom-scrollbar" 
                            value={caption} 
                            onChange={(e) => handleCaptionChange(e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => handleKey(e, bookmark)}
                            // onBlur={() => setIsInputActive(false)}
                            autoFocus
                        />
                        :
                        <span 
                            className='break-words' 
                            onClick={(e) => (e.stopPropagation(), setIsInputActive(true))}
                            title={chrome.i18n.getMessage('editBookmark')}
                        >
                            {bookmark.bookMarkCaption}
                        </span>}
                        {!isInputActive ?
                        <>
                        <motion.div 
                            className="absolute top-0 -right-4 bg-primary dark:bg-blue-900 rounded-full place-items-center flex flex-auto leading-normal border-2 border-dark dark:border-light hover:animate-pulse transform hover:scale-105 hover:border-b-blue-900 dark:hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out" aria-label="expand bookmark"
                            onClick={(e) => handleExpand(e)}
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            key="expand-button-motion"
                            title={chrome.i18n.getMessage('expandToggle')}
                        >
                            <MdExpandMore className="w-[14px] h-auto object-fit rounded-full dark:fill-light fill-dark" aria-label="expand bookmark" />
                        </motion.div>
                        <div 
                            className={`absolute top-0 -right-9 bg-primary dark:bg-blue-900 border-dark dark:border-light hover:animate-pulse transform hover:scale-105 hover:border-b-blue-900 dark:hover:border-b-blue-300 rounded-full place-items-center flex flex-auto leading-normal border-2 cursor-pointer transition-all duration-150 ease-in-out`}
                            aria-label="edit bookmark"
                            onClick={(e) => (
                                e.stopPropagation(),
                                setIsInputActive(true)
                            )}
                            key="edit-button"
                            title={chrome.i18n.getMessage('editBookmark')}
                        >
                            <MdEdit className="w-[14px] h-auto object-fit rounded-full dark:fill-light fill-dark" aria-label="edit bookmark" />
                        </div>
                        </>
                        :
                        <>
                        <div 
                            className="absolute top-0 -right-9 z-50 bg-primary dark:bg-blue-900 border-dark dark:border-light hover:animate-pulse transform hover:scale-105 hover:border-b-blue-900 dark:hover:border-b-blue-300 rounded-full place-items-center flex flex-auto leading-normal border-2 cursor-pointer transition-all duration-150 ease-in-out" aria-label="discard changes bookmark"
                            onClick={(e) => (
                                e.stopPropagation(),
                                setIsInputActive(false)
                            )}
                            key="discard-button"
                            title={chrome.i18n.getMessage('discardChanges')}
                        >
                            <MdEditOff className="w-[14px] h-auto object-fit rounded-full dark:fill-light fill-dark" aria-label="discard changes bookmark" />
                        </div>
                        <div 
                            className="absolute top-0 -right-4 z-50 bg-primary dark:bg-blue-900 border-dark dark:border-light hover:animate-pulse transform hover:scale-105 hover:border-b-blue-900 dark:hover:border-b-blue-300 rounded-full place-items-center flex flex-auto leading-normal border-2 cursor-pointer transition-all duration-150 ease-in-out" aria-label="save bookmark"
                            onClick={(e) => handleClick(e, bookmark)}
                            key="save-button"
                            title={chrome.i18n.getMessage('saveChanges')}
                        >
                            <MdSave className="w-[14px] h-auto object-fit rounded-full dark:fill-light fill-dark" aria-label="save bookmark"/>
                        </div>
                        </>
                        }
                    </div>
                    <div 
                        className="w-[24px] h-auto" aria-label="space between"
                        key="space-between"
                    >
                    </div>
                    <div 
                        className="bg-red-600 rounded-full place-items-center flex flex-auto leading-normal border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 hover:border-red-500 cursor-pointer transition-all duration-150 ease-in-out" aria-label="play from bookmark"
                        onClick={(e) => handleBookmarkPLay(e, bookmark)}
                        key="play-button"
                        title={chrome.i18n.getMessage('playBookmark')}
                    >
                        <HiPlayPause className="w-[24px] h-auto object-fit rounded-full fill-light" aria-label="play from bookmark" />
                    </div>
                </div>
                </motion.div>
            </div>
        </div>
        <div className={`absolute left-0 top-0 content-center z-30 items-center ${bookmarkState[bookmark.time.toString()].isSelected ? 'w-[12px]' : 'w-[8px]'} hover:w-[12px] hover:cursor-pointer transform transition-all duration-150 ease-in-out h-[100%] ${bookmark.color} rounded-lg`} onClick={(e) => handleBookmarkSelect(e, bookmark)}>
            {bookmarkState[bookmark.time.toString()].isSelected ? 
                <GrRadialSelected className='dark:stroke-light stroke-dark w-full h-auto my-auto z-0' /> : ''
            }
        </div>
    </div>
    );
};

export default Bookmark;