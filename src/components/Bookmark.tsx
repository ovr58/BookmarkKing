import React, { useEffect, useState } from 'react';
import { ActiveTab, getTimestamp, onUpdate, VideoElementInfo } from '../utils';

import { MdDeleteForever } from "react-icons/md";
import { HiPlayPause } from "react-icons/hi2";
import { MdExpandMore, MdEdit, MdEditOff, MdSave } from "react-icons/md";

import { motion } from 'framer-motion';


interface BookmarkProps {
    bookmark: VideoElementInfo,
    curTab: ActiveTab;
    handleBookmarkPLay: (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => void;
    handleBookmarkDelete: (e: React.MouseEvent<HTMLDivElement>, bookmark: VideoElementInfo) => void;
}

const Bookmark: React.FC<BookmarkProps> = ({ bookmark, curTab, handleBookmarkPLay, handleBookmarkDelete }) => {
    const url = new URL(curTab.url || '')
    const faviconUrl = `${url.origin}/favicon.ico`

    const [isExpanded, setExpand] = useState(false)

    const [isInputActive, setIsInputActive] = useState(false)

    const [caption, setCaption] = useState(bookmark.bookMarkCaption)

    const [collapsedHeight, setCollapsedHeight] = useState<{collapsedHeight: string, expandedHeight: string} | null>({collapsedHeight: 'auto', expandedHeight: 'auto'})

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
        onUpdate(curTab, updatedBookmark).then(() => {
            if (caption.length > 140) {
                setExpand(true)
            }
            setCollapsedHeight({collapsedHeight: 'auto', expandedHeight: 'auto'})
            setIsInputActive(false)
            console.log('Message Sent')
        })
    }

    useEffect(() => {
        if (collapsedRef.current) {
            console.log(collapsedHeight)
            setCollapsedHeight((prev) => {
                if (prev?.collapsedHeight === 'auto') {
                    return {
                        collapsedHeight: `${collapsedRef.current?.clientHeight}px`,
                        expandedHeight: 'auto'
                    }
                } else if (prev?.collapsedHeight !== 'auto' && prev?.expandedHeight === 'auto' && prev?.collapsedHeight !== `${collapsedRef.current?.clientHeight}px`) {
                    return {
                        ...prev,
                        expandedHeight: `${collapsedRef.current?.clientHeight}px`
                    }
                } else {
                    return prev
                }
            })
        }
    }, [isExpanded])
    
    return (
        <div 
            className="max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg overflow-hidden"
        >
            <div className="px-2 py-2">
                <div className="flex items-start">
                    <img className="w-6 h-6 mr-2 pb-2" src={faviconUrl} alt="bookmark-icon" />
                    <div className="flex-grow truncate">
                        <div className="w-full cursor-pointer select-none sm:flex justify-between items-center mb-3">
                            <h2 className="text-md leading-snug font-extrabold text-gray-50 truncate mb-1">{`${getTimestamp(bookmark.time)} > ${bookmark.title}`}</h2>
                        </div>
                        <motion.div
                            initial={{ height: 'auto' }}
                            animate={{ height: isExpanded ? collapsedHeight?.expandedHeight : collapsedHeight?.collapsedHeight }}
                            transition={{ duration: 0.3 }}
                        >
                        <div ref={collapsedRef} className="flex items-end justify-between whitespace-normal gap-2" style={{ height: isExpanded ? collapsedHeight?.expandedHeight : collapsedHeight?.collapsedHeight }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                            <div className="relative text-indigo-100 w-full" style={{ height: isExpanded ? collapsedHeight?.expandedHeight : collapsedHeight?.collapsedHeight}}>
                                {isInputActive ? 
                                <textarea 
                                    className="bg-indigo-600 text-indigo-100 w-full h-full border-0 outline-none overflow-y-auto rounded-lg focus:ring-2 focus:border-2 focus:border-b-blue-800 focus:rounded-md whitespace-normal resize-none custom-scrollbar" 
                                    value={caption} 
                                    onChange={(e) => handleCaptionChange(e)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => handleKey(e, bookmark)}
                                    // onBlur={() => setIsInputActive(false)}
                                    autoFocus
                                />
                                :
                                <span onClick={(e) => (e.stopPropagation(), setIsInputActive(true))}>
                                    {
                                        bookmark.bookMarkCaption.length > 140 ? 
                                            isExpanded ? 
                                                `${bookmark.bookMarkCaption}` :
                                                `${bookmark.bookMarkCaption.substring(0, 140)}...` 
                                            : `${bookmark.bookMarkCaption}`
                                    }
                                </span>}
                                {bookmark.bookMarkCaption.length > 140 && !isInputActive &&
                                <motion.div 
                                    className="absolute top-0 -right-5 bg-blue-900 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out" aria-label="expand bookmark"
                                    onClick={(e) => (
                                        e.stopPropagation(),
                                        setExpand(!isExpanded))
                                    }
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <MdExpandMore className="w-[14px] h-auto object-fit rounded-full fill-white" aria-label="expand bookmark" />
                                </motion.div>
                                }
                                {isInputActive ?
                                <>
                                <div 
                                    className="absolute top-0 -right-5 z-auto bg-blue-900 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out" aria-label="discard changes bookmark"
                                    onClick={(e) => (
                                        e.stopPropagation(),
                                        setIsInputActive(false)
                                    )}
                                >
                                    <MdEditOff className="w-[14px] h-auto object-fit rounded-full fill-white" aria-label="discard changes bookmark" />
                                </div>
                                <div 
                                    className="absolute top-0 -right-10 z-50 bg-blue-900 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out" aria-label="save bookmark"
                                    onClick={(e) => handleClick(e, bookmark)}
                                >
                                    <MdSave className="w-[14px] h-auto object-fit rounded-full fill-white" aria-label="save bookmark"/>
                                </div>
                                </>
                                :
                                <div 
                                    className={`absolute top-0 -right-${bookmark.bookMarkCaption.length > 140 ? '10': '5'} bg-blue-900 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out`}
                                    aria-label="edit bookmark"
                                    onClick={(e) => (
                                        e.stopPropagation(),
                                        setIsInputActive(true)
                                    )}
                                >
                                    <MdEdit className="w-[14px] h-auto object-fit rounded-full fill-white" aria-label="edit bookmark" />
                                </div>
                                }
                            </div>
                            <div 
                                className="bg-red-600 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-red-500 cursor-pointer transition-all duration-150 ease-in-out" aria-label="play from bookmark"
                                onClick={(e) => handleBookmarkPLay(e, bookmark)}
                            >
                                <HiPlayPause className="w-[24px] h-auto object-fit rounded-full fill-white" aria-label="play from bookmark" />
                            </div>
                            <div 
                                className="bg-red-600 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-red-500 cursor-pointer transition-all duration-150 ease-in-out"  aria-label="delete bookmark"
                                onClick={(e) => handleBookmarkDelete(e, bookmark)}
                            >
                                <MdDeleteForever className="w-[24px] h-auto object-fit rounded-full fill-white" aria-label="delete from bookmarks" />
                            </div>
                        </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookmark;