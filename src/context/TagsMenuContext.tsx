import { motion, AnimatePresence } from 'framer-motion';
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import useChromeApi from '../hooks/useChromeApi';
import { VideoElementInfo } from '../utils';


export interface tagListItem {
  label: string;
  title: string;
  command: string;
  handleFunction: () => void;
}

export interface TagContextProps {
    setTagMenu: (tagListItems: tagListItem[], position: { x: number | null; y: number | null }) => void;
}

export const TagContext = createContext<TagContextProps>({ 
    setTagMenu: () => {},
});


export const TagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
    const { curTab, allVideosWithBookmarks } = useChromeApi()

    const [tagMenuItems, setTagMenuItems] = useState<tagListItem[]>([]);

    const [tagMenuPosition, setTagMenuPosition] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });                   
    
    const setTagMenu = useCallback((tagListItems: tagListItem[], position: { x: number | null, y: number | null}) => {
        const hashtagsMap: Record<string, VideoElementInfo[]> = {};
        Object.keys(allVideosWithBookmarks).forEach((key: string) => {
          allVideosWithBookmarks[key].forEach((bookmark: VideoElementInfo) => {
            const matches: string[] | null = bookmark.bookMarkCaption.match(/#\w+/g);
          if (matches) {
              matches.forEach((tag: string) => {
                if (!hashtagsMap[tag]) {
                  hashtagsMap[tag] = [];
                }
                hashtagsMap[tag].push(bookmark);
              });
          }
            });
        });

        Object.keys(hashtagsMap).forEach(tag => {
            tagListItems.push({
          label: tag,
          title: `Videos with tag ${tag}`,
          command: `filter_${tag}`,
          handleFunction: async () => {
              console.log(`Filtering videos by tag: ${tag}`);
              await chrome.storage.local.set({ bookmarks: hashtagsMap[tag] });
              await chrome.sidePanel.open({ tabId: curTab.id });
              await chrome.sidePanel.setOptions({
                tabId: curTab.id,
                path: 'side-panel.html',
                enabled: true
              });
          }
            });
        });

        console.log('TAG MENU ITEMS:', tagListItems)

        setTagMenuItems(tagListItems);
        setTagMenuPosition(position);
        
    }, [allVideosWithBookmarks, curTab.id]);

    const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
    
    const contextMenuRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
          setTagMenuPosition({ x: null, y: null });
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [contextMenuRef, setTagMenuPosition]);
  
    const handleSelect = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
      menuItem: tagListItem
    ) => {
      e.preventDefault();
      e.stopPropagation();
      menuItem.handleFunction();
      setTagMenuPosition({ x: null, y: null });
    };
  
    const handleMouseLeave = () => {
      const timeout = setTimeout(() => setTagMenuPosition({ x: null, y: null }), 5000);
      setCloseTimeout(timeout);
    };
  
    const handleMouseEnter = () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        setCloseTimeout(null);
      }
    };
    
    return (
      <TagContext.Provider value={{ setTagMenu }}>
        {tagMenuPosition.x !== null && 
        <AnimatePresence key='context-menu-presence'>
        <motion.div
          ref={contextMenuRef}
          key={`${tagMenuPosition.x}_${tagMenuPosition.y}`}        
          className='flex flex-col py-1 text-left gap-1 z-[9990] w-fit h-auto truncate rounded-lg bg-light border-solid border-dark border-1 dark:border-none dark:bg-primaryDark'
          style={{ position: 'absolute', top: (tagMenuPosition.y ?? 0), left: (tagMenuPosition.x ?? 0) }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
        {tagMenuItems.map((tagItem, i) => {
          const colorInUse = tagItem.command.includes('sameColor') ? `${tagItem.command.split('_')[1]}` : '';
          return (
            <div 
              key={`${JSON.stringify(tagItem)}_${i}`} 
              className="
                w-full 
                h-auto 
                z-[9999] 
                px-2
                align-middle
                content-center
                flex flex-row 
                items-center
                justify-between
                dark:text-light 
                hover:bg-primaryDark 
                text-black 
                hover:text-white 
                dark:hover:text-dark
                dark:hover:bg-light 
                cursor-pointer select-none" 
              onClick={(e) => handleSelect(e, tagItem)} 
              title={tagItem.title} 
              aria-label={`menu button for ${tagItem.command}`}
            >
              {tagItem.label}
              {colorInUse !== '' && 
              <div className={`inline-block ml-3 w-4 h-4 ${colorInUse} rounded-lg`}></div>
              }
            </div>
          )
        }
        )}
        </motion.div>
        </AnimatePresence>
        }
        {children}
      </TagContext.Provider>
    );
  };