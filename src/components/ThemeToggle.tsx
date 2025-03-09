/* global chrome */

import { IoIosSunny, IoIosMoon } from "react-icons/io";
import useTheme from "../hooks/useTheme";

const ThemeToggle: React.FC = () => {
    
    const curTheme  = useTheme();

    const setTheme = () => {
        const newTheme = curTheme === 'light' ? 'dark' : 'light';
        chrome.storage.sync.set({ 'curTheme': newTheme });
        console.log('Theme set to:', curTheme, newTheme);
    }

    return (
        <button
            onClick={() => setTheme()}
            title={chrome.i18n.getMessage('toggleTheme')}
            className={`
                flex
                items-center
                gap-[3px]
                text-[18px]
                p-[3px]
                bg-primary
                text-dark
                rounded-full
                relative
                after:content-['']
                after:absolute
                after:bg-light
                after:h-[18px]
                after:w-[18px]
                after:rounded-full
                after:ease-in-out
                after:duration-300
                after:transition-all
                ${curTheme === 'light' ? 
                    'after:left-[3px]' : 
                    'after:left-[calc(3px+18px+3px)]'}
                `}
        >
            <IoIosSunny></IoIosSunny>
            <IoIosMoon></IoIosMoon>
        </button>
    );
}

export default ThemeToggle;