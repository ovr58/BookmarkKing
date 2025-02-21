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
                    <img className="w-6 h-6 rounded-lg mr-3" src={faviconUrl} alt="bookmark-icon" />
                    <div className="flex-grow truncate">
                        <div className="w-full sm:flex justify-between items-center mb-3">
                            <h2 className="text-lg leading-snug font-extrabold text-gray-50 truncate mb-1 sm:mb-0">{bookmark.title}</h2>
                        </div>
                        <div className="flex items-end justify-between whitespace-normal">
                            <div className="max-w-md text-indigo-100">
                                <p className="mb-2">{bookmark.bookMarkCaption}</p>
                            </div>
                            <div className="bg-primary p-2 uppercase leading-normal shadow-primary-3 transition duration-150 ease-in-out hover:bg-primary-accent-300 hover:shadow-primary-2 focus:bg-primary-accent-300 focus:shadow-primary-2 focus:outline-none focus:ring-0 active:bg-primary-600 active:shadow-primary-2 motion-reduce:transition-none dark:shadow-black/30 dark:hover:shadow-dark-strong dark:focus:shadow-dark-strong dark:active:shadow-dark-strong rounded-full place-items-center flex flex-auto w-[24px] h-[24px]" aria-label="delete bookmark">
                                <img className="w-[24px] h-[24px] rounded-full ml-2" src={playImg} alt="play-icon" aria-label="play from bookmark" />
                            </div>
                            <div className="bg-primary p-2 uppercase leading-normal shadow-primary-3 transition duration-150 ease-in-out hover:bg-primary-accent-300 hover:shadow-primary-2 focus:bg-primary-accent-300 focus:shadow-primary-2 focus:outline-none focus:ring-0 active:bg-primary-600 active:shadow-primary-2 motion-reduce:transition-none dark:shadow-black/30 dark:hover:shadow-dark-strong dark:focus:shadow-dark-strong dark:active:shadow-dark-strong rounded-full place-items-center flex flex-auto w-[24px] h-[24px]"  aria-label="delete bookmark">
                                <img className="w-[24px] h-[24px] rounded-full ml-2" src={deleteImg} alt="play-icon" aria-label="play from bookmark" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookmark;