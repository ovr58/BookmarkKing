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
    curTab: ActiveTab;
}

const Bookmark: React.FC<BookmarkProps> = ({ bookmark, curTab }) => {
    const url = new URL(curTab.url || '')
    const faviconUrl = `${url.origin}/favicon.ico`
    const playImg = '/assets/play64x64.png'
    const deleteImg = '/assets/delete64x64.png'
    return (
        <div className="max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg">
            <div className="px-2 py-2">
                <div className="flex items-start">
                    <img className="w-6 h-6 rounded-lg mr-2" src={faviconUrl} alt="bookmark-icon" />
                    <div className="flex-grow truncate">
                        <div className="w-full sm:flex justify-between items-center mb-3">
                            <h2 className="text-lg leading-snug font-extrabold text-gray-50 truncate mb-1 sm:mb-0">{bookmark.title}</h2>
                        </div>
                        <div className="flex items-end justify-between whitespace-normal">
                            <div className="max-w-md text-indigo-100">
                                <p className="mb-2">{bookmark.bookMarkCaption}</p>
                            </div>
                            <img className="flex items-center justify-center w-[24px] h-[24px] rounded-full border-2 from-red-400 to-red-600 hover:from-white hover:to-indigo-50 focus:outline-none focus-visible:from-white focus-visible:to-white transition duration-150 ml-2" src={playImg} alt="play-icon" aria-label="play from bookmark" />
                            <img className="flex items-center justify-center w-[24px] h-[24px] rounded-full bg-gradient-to-b from-indigo-50 to-indigo-100 hover:from-white hover:to-indigo-50 focus:outline-none focus-visible:from-white focus-visible:to-white transition duration-150 ml-2" src={deleteImg} alt="play-icon" aria-label="delete bookmark" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookmark;