import { MdBookmarkAdd } from "react-icons/md";
import { menuListItem } from "../context/ContextMenuContext";
import { useCallback, useMemo } from "react";
import { useContextMenu } from "../hooks/useContextMenu";

interface SortButtonProps {
  onClick: () => void 
}

function AddBookmarkButton({ onClick }: SortButtonProps) {

  const { setContextMenu } = useContextMenu();
  
  const menuListItems = useMemo(() => {
    const items: menuListItem[] = [];

    items.push({
      label: chrome.i18n.getMessage('addBookmark'),
      title: chrome.i18n.getMessage('addBookmark'),
      command: 'addBookmark',
      handleFunction: () => onClick(),
    })
    return items;
  }, [onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
      
    setContextMenu(menuListItems, { x: e.clientX, y: e.clientY });
  }, [setContextMenu, menuListItems]);
  
  return (
    <div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      onClick={() => onClick()} 
      onContextMenu={(e) => handleContextMenu(e)}
      title={chrome.i18n.getMessage('addBookmark')}
      key='addbookmark-button-container'
    >
      <MdBookmarkAdd className="w-full p-1 h-auto object-fit rounded-full dark:stroke-light stroke-dark fill-dark dark:fill-light cursor-pointer" aria-label="bookmark sort type" />
    </div>
  )
}

export default AddBookmarkButton