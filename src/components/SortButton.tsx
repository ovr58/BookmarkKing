import { GrSort } from "react-icons/gr";
import { menuListItem } from "../context/ContextMenuContext";
import { useCallback, useMemo } from "react";
import { useContextMenu } from "../hooks/useContextMenu";

interface SortButtonProps {
  onClick: React.Dispatch<React.SetStateAction<boolean[]>> 
  sortedOrder: boolean[]
}

function SortButton({ onClick, sortedOrder }: SortButtonProps) {

  const sortTypesArray = useMemo(() => [
    [true, false, false, false], 
    [false, true, false, false],
    [false, false, true, false],
    [false, false, false, true],
    [true, false, true, false],
    [true, false, false, true],
    [false, true, true, false],
    [false, true, false, true]
], [])

  const arraysEqual = (a: boolean[], b: boolean[]) => {
      return a.length === b.length && a.every((value, index) => value === b[index]);
  };

  const sortTypeIndex = sortTypesArray.findIndex(order => arraysEqual(order, sortedOrder));

  const { setContextMenu } = useContextMenu();
  
    const menuListItems = useMemo(() => {
      const items: menuListItem[] = [];

      sortTypesArray.forEach((sortType) => {
        items.push({
          label: chrome.i18n.getMessage(sortType.join('') as string),
          title: chrome.i18n.getMessage(sortType.join('') as string),
          command: sortType.join(''),
          handleFunction: () => onClick(sortType),
        })
      })
      return items;
    }, [sortTypesArray, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
      
    setContextMenu(menuListItems, { x: e.clientX, y: e.clientY });
  }, [setContextMenu, menuListItems]);
  
  return (
    <div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      onClick={() => onClick(sortTypesArray[(sortTypeIndex + 1) % sortTypesArray.length])} 
      onContextMenu={(e) => handleContextMenu(e)}
      title={chrome.i18n.getMessage(sortedOrder.join('') as string)}
      key='sort-button-container'
    >
      <GrSort className="w-full p-1 h-auto object-fit rounded-full dark:stroke-light stroke-dark cursor-pointer" aria-label="bookmark sort type" />
    </div>
  )
}

export default SortButton