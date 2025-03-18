import { BsCheckAll } from "react-icons/bs";
import { menuListItem } from "../context/ContextMenuContext";
import { useContextMenu } from "../hooks/useContextMenu";
import { useCallback, useMemo } from "react";

interface SelectAllButtonProps {
  onClick: (commandKey: string) => void,
  isAnySelected: boolean,
  isAllSelected: boolean,
  colorsInUse: string[],
}

function SelectAllButton({ onClick, isAnySelected, isAllSelected, colorsInUse }: SelectAllButtonProps) {

  const { setContextMenu } = useContextMenu();

  const menuListItems = useMemo(() => {
    const items: menuListItem[] = [];

    if (isAnySelected) {
      items.push({
      label: chrome.i18n.getMessage('deselectAll'),
      title: chrome.i18n.getMessage('deselectAll'),
      command: 'deselectAll',
      handleFunction: () => onClick('deselectAll'),
    })
  }

  if (!isAllSelected) {
    items.push({
      label: chrome.i18n.getMessage('selectAll'),
      title: chrome.i18n.getMessage('selectAll'),
      command: 'selectAll',
      handleFunction: () => onClick('selectAll'),
    })
    if (isAnySelected) {
      items.push({
        label: chrome.i18n.getMessage('invertSelection'),
        title: chrome.i18n.getMessage('invertSelection'),
        command: 'invertSelection',
        handleFunction: () => onClick('invertSelection'),
      })
    } 
  }
  console.log('COLORS - ', colorsInUse)
  if (colorsInUse.length > 1) {
    colorsInUse.forEach(colorInUse => {
      items.push({
        label: chrome.i18n.getMessage('selectSameColor'),
        title: chrome.i18n.getMessage('selectSameColor'),
        command: `sameColor_${colorInUse}`,
        handleFunction: () => onClick(`sameColor_${colorInUse}`),
      })
    })}
    return items;
  }, [isAnySelected, isAllSelected, colorsInUse, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
     
    setContextMenu(menuListItems, { x: e.clientX, y: e.clientY });
  }, [setContextMenu, menuListItems]);

  return (
    <div className="relative" key='select-all-button-container'>
    <div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      onClick={() => onClick('invertSelection')} 
      onContextMenu={(e) => handleContextMenu(e)}
      key='select-all-button-container'
      title={chrome.i18n.getMessage('selectAll')}
    >
        <BsCheckAll className="w-full p-1 h-auto object-fit rounded-full dark:fill-light fill-dark cursor-pointer" aria-label="bookmark select" />
    </div>
    </div>
    
  )
}

export default SelectAllButton