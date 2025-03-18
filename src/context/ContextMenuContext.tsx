import { motion, AnimatePresence } from 'framer-motion';
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

export interface menuListItem {
  label: string;
  title: string;
  command: string;
  handleFunction: () => void;
}

export interface MenuContextProps {
    setContextMenu: (menuListItem: menuListItem[], position: { x: number | null; y: number | null }) => void;
}

export const MenuContext = createContext<MenuContextProps>({ 
    setContextMenu: () => {},
});


export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    const [contextMenuItems, setContextMenuItems] = useState<menuListItem[]>([]);

    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });                   
    
    const setContextMenu = useCallback((menuListItems: menuListItem[], position: { x: number | null, y: number | null}) => {
        setContextMenuItems(menuListItems);
        setContextMenuPosition(position);
    }, []);

    const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
    
    const contextMenuRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
          setContextMenuPosition({ x: null, y: null });
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [contextMenuRef, setContextMenuPosition]);
  
    const handleSelect = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
      menuItem: menuListItem
    ) => {
      e.preventDefault();
      e.stopPropagation();
      menuItem.handleFunction();
      setContextMenuPosition({ x: null, y: null });
    };
  
    const handleMouseLeave = () => {
      const timeout = setTimeout(() => setContextMenuPosition({ x: null, y: null }), 5000);
      setCloseTimeout(timeout);
    };
  
    const handleMouseEnter = () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        setCloseTimeout(null);
      }
    };
    
    return (
      <MenuContext.Provider value={{ setContextMenu }}>
        {contextMenuPosition.x !== null && 
        <AnimatePresence key='context-menu-presence'>
        <motion.div
          ref={contextMenuRef}
          key={`${contextMenuPosition.x}_${contextMenuPosition.y}`}        
          className='flex flex-col py-1 text-left gap-1 z-[9990] w-fit h-auto truncate rounded-lg bg-light border-solid border-dark border-1 dark:border-none dark:bg-primaryDark'
          style={{ position: 'absolute', top: (contextMenuPosition.y ?? 0), left: (contextMenuPosition.x ?? 0) }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
        {contextMenuItems.map((menuItem, i) => {
          const colorInUse = menuItem.command.includes('sameColor') ? `${menuItem.command.split('_')[1]}` : '';
          return (
            <div 
              key={`${JSON.stringify(menuItem)}_${i}`} 
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
              onClick={(e) => handleSelect(e, menuItem)} 
              title={menuItem.title} 
              aria-label={`menu button for ${menuItem.command}`}
            >
              {menuItem.label}
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
      </MenuContext.Provider>
    );
  };