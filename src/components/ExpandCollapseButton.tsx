import { MdExpandMore } from "react-icons/md"

import { motion } from "framer-motion"
import { useContextMenu } from "../hooks/useContextMenu";
import { useCallback, useMemo } from "react";
import { menuListItem } from "../context/ContextMenuContext";


interface ExpandCollapseButtonProps {
  onClick: (commandKey: string) => void,
  isAnyExpanded: boolean,
  isAnySelected: boolean,
  isAllExpanded: boolean,
  colorsInUse: string[],
}

function ExpandCollapseButton({ onClick, isAllExpanded, isAnySelected, isAnyExpanded, colorsInUse }: ExpandCollapseButtonProps) {

const { setContextMenu } = useContextMenu();

  const menuListItems = useMemo(() => {
    const items: menuListItem[] = [];

    if (isAnySelected) {
      items.push({
      label: chrome.i18n.getMessage('collapseSelected'),
      title: chrome.i18n.getMessage('collapseSelected'),
      command: 'collapseSelected',
      handleFunction: () => onClick('collapseSelected'),
    })
    }

    !isAllExpanded && items.push({
      label: chrome.i18n.getMessage('expandAll'),
      title: chrome.i18n.getMessage('expandAll'),
      command: 'expandAll',
      handleFunction: () => onClick('expandAll'),
    })

    if (isAnyExpanded) {
      items.push({
        label: chrome.i18n.getMessage('collapseAll'),
        title: chrome.i18n.getMessage('collapseAll'),
        command: 'collapseAll',
        handleFunction: () => onClick('collapseAll'),
      })
      !isAllExpanded && items.push({
        label: chrome.i18n.getMessage('inverseExpand'),
        title: chrome.i18n.getMessage('inverseExpand'),
        command: 'inverseExpand',
        handleFunction: () => onClick('inverseExpand'),
      })
    }

    if (colorsInUse.length > 1) {
      colorsInUse.forEach(colorInUse => {
        items.push({
          label: chrome.i18n.getMessage('expandSameColor'),
          title: chrome.i18n.getMessage('expandSameColor'),
          command: `sameColor_${colorInUse}`,
          handleFunction: () => onClick(`sameColor_${colorInUse}`),
        })
      })}
    return items;
  }, [isAllExpanded, isAnyExpanded, colorsInUse, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
      
    setContextMenu(menuListItems, { x: e.clientX, y: e.clientY });
  }, [setContextMenu, menuListItems]);

  return (
    <motion.div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      animate={{ rotate: isAnyExpanded ? 180 : 0 }}
      transition={{ duration: 0.3 }}
      key="expand-button-motion"
      onClick={() => onClick(isAnyExpanded ? 'collapseAll' : 'expandAll')} 
      title={chrome.i18n.getMessage('expandToggle')} 
      onContextMenu={(e) => handleContextMenu(e)}         
    >
      <MdExpandMore 
        className="w-full p-1 h-auto object-fit rounded-full dark:fill-light fill-dark cursor-pointer"
        aria-label="all bookmarks expand" 
      />
    </motion.div>
  )
}

export default ExpandCollapseButton