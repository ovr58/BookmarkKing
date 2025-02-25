import React from 'react';
import { ActiveTab, getTimestamp, VideoElementInfo } from '../utils';

import { MdDeleteForever } from "react-icons/md";
import { HiPlayPause } from "react-icons/hi2";

import { motion } from 'framer-motion';


interface BookmarkProps {
    bookmark: VideoElementInfo,
    curTab: ActiveTab;
    isOpen: { [key: string]: number };
    setIsOpen: React.Dispatch<React.SetStateAction<{ [key: string]: number; }>>;
}

const Bookmark: React.FC<BookmarkProps> = ({ bookmark, curTab, isOpen, setIsOpen }) => {
    const url = new URL(curTab.url || '')
    const faviconUrl = `${url.origin}/favicon.ico`
    
    return (
        <motion.div 
            className="max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg overflow-hidden"
            initial={{ opacity: 1, height: 'full' }}
            animate={{ height: isOpen[bookmark.time.toString()] === bookmark.time ? 'full' : '36px' }}
            exit={{ opacity: 1, height: '36px', margin: 0, padding: 0 }}
            transition={{ duration: 0.5 }}>
            <div className="px-2 py-2">
                <div className="flex items-start">
                    <img className="w-6 h-6 mr-2 pb-2" src={faviconUrl} alt="bookmark-icon" />
                    <div className="flex-grow truncate" onClick={() => setIsOpen(
                        isOpen[bookmark.time.toString()] && 
                        isOpen[bookmark.time.toString()] === bookmark.time ?
                        { ...isOpen, [bookmark.time.toString()]: -1 } : 
                        { ...isOpen, [bookmark.time.toString()]: bookmark.time }
                    )}>
                        <div className="w-full cursor-pointer select-none sm:flex justify-between items-center mb-3">
                            <h2 className="text-md leading-snug font-extrabold text-gray-50 truncate mb-1 sm:mb-0">{`${getTimestamp(bookmark.time)} > ${bookmark.title}`}</h2>
                        </div>
                        <div className="flex items-end justify-between whitespace-normal gap-2">
                            <div className="max-w-md text-indigo-100">
                                <p className="mb-2">{bookmark.bookMarkCaption}</p>
                            </div>
                            <div className="bg-red-600 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-red-500 cursor-pointer transition-all duration-150 ease-in-out" aria-label="play from bookmark">
                                <HiPlayPause className="w-[24px] h-auto object-fit rounded-full fill-white" aria-label="play from bookmark" />
                            </div>
                            <div className="bg-red-600 rounded-full place-items-center flex flex-auto leading-normal border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-red-500 cursor-pointer transition-all duration-150 ease-in-out"  aria-label="delete bookmark">
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