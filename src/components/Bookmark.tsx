import React from 'react';
import { ActiveTab, getTimestamp, VideoElementInfo } from '../utils';

import { MdDeleteForever } from "react-icons/md";
import { HiPlayPause } from "react-icons/hi2";
import { MdExpandMore } from "react-icons/md";

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

    const [isOpen, setIsOpen] = React.useState(true)

    const [isExpanded, setExpand] = React.useState(false)
    
    return (
        <motion.div 
            className="max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg overflow-hidden"
            initial={{ opacity: 1, height: '36px' }}
            animate={{ height: isOpen ? 'auto' : '36px'}}
            exit={{ opacity: 0, height: '36px', margin: 0, padding: 0 }}
            transition={{ duration: 0.3 }}>
            <div className="px-2 py-2">
                <div className="flex items-start">
                    <img className="w-6 h-6 mr-2 pb-2" src={faviconUrl} alt="bookmark-icon" />
                    <div className="flex-grow truncate" onClick={() => setIsOpen(
                        !isOpen
                    )}>
                        <div className="w-full cursor-pointer select-none sm:flex justify-between items-center mb-3">
                            <h2 className="text-md leading-snug font-extrabold text-gray-50 truncate mb-1 sm:mb-0">{`${getTimestamp(bookmark.time)} > ${bookmark.title}`}</h2>
                        </div>
                        <div className="flex items-end justify-between whitespace-normal gap-2">
                            <div className="relative max-w-md max-h-fit text-indigo-100 h-full pr-2 mb-3">
                                <p>
                                    {bookmark.bookMarkCaption.length > 280 ? `${bookmark.bookMarkCaption.substring(0, 280)}` : `${bookmark.bookMarkCaption}`}
                                </p>
                                <motion.div 
                                    className="absolute top-0 -right-5 bg-blue-900 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out" aria-label="expand bookmark"
                                    onClick={(e) => (
                                        e.preventDefault(),
                                        e.stopPropagation(),
                                        setExpand(!isExpanded))
                                    }
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <MdExpandMore className="w-[14px] h-auto object-fit rounded-full fill-white" aria-label="expand bookmark" />
                                </motion.div>
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
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Bookmark;