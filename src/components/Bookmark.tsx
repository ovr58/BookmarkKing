import React from 'react';
import { ActiveTab } from '../utils';

interface BookmarkProps {
    bookmark: {
        id: string;
        urlTemplate?: string;
        time: number;
        title: string;
        bookMarkCaption?: string;
    },
    currTab: ActiveTab;
}

const Bookmark: React.FC<BookmarkProps> = ({ bookmark, currTab }) => {
    const url = new URL(currTab.url || '');
    const faviconUrl = `${url.origin}/favicon.ico`;
    return (
        <div className="max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg">
            <div className="px-2 py-2">
                <div className="flex items-start">
                    <img className="w-8 h-8 rounded-lg" src={faviconUrl} alt="bookmark-icon" />
                    <div className="flex-grow truncate">
                        <div className="w-full sm:flex justify-between items-center mb-3">
                            <h2 className="text-lg leading-snug font-extrabold text-gray-50 truncate mb-1 sm:mb-0">${bookmark.title}</h2>
                        </div>
                        <div className="flex items-end justify-between whitespace-normal">
                            <div className="max-w-md text-indigo-100">
                                <p className="mb-2">${bookmark.bookMarkCaption}</p>
                            </div>
                            <button className="flex-shrink-0 flex items-center justify-center text-indigo-600 w-6 h-6 rounded-full bg-gradient-to-b from-indigo-50 to-indigo-100 hover:from-white hover:to-indigo-50 focus:outline-none focus-visible:from-white focus-visible:to-white transition duration-150 ml-2" aria-label="play from bookmark">
                                <img className='w-6 h-6 cursor-pointer shadow-amber-700 shadow' src="play64x64.png" alt="play-icon" />
                            </button>
                            <button className="flex-shrink-0 flex items-center justify-center text-indigo-600 w-6 h-6 rounded-full bg-gradient-to-b from-indigo-50 to-indigo-100 hover:from-white hover:to-indigo-50 focus:outline-none focus-visible:from-white focus-visible:to-white transition duration-150 ml-2" aria-label="delete bookmark">
                                <img className='w-6 h-6 cursor-pointer shadow-amber-700 shadow' src="delete64x64.png" alt="play-icon" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookmark;