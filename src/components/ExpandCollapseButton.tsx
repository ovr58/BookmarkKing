import { MdExpandMore } from "react-icons/md"

import { motion } from "framer-motion"


interface ExpandCollapseButtonProps {
  onClick: () => void
  isAllExpanded: boolean
}

function ExpandCollapseButton({ onClick, isAllExpanded }: ExpandCollapseButtonProps) {
  return (
    <motion.div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' onClick={onClick} title={chrome.i18n.getMessage('expandToggle')} 
      animate={{ rotate: isAllExpanded ? 180 : 0 }}
      transition={{ duration: 0.3 }}
      key="expand-button-motion"
    >
      <MdExpandMore 
        className="w-full p-1 h-auto object-fit rounded-full dark:fill-light fill-dark cursor-pointer"
        aria-label="all bookmarks expand" 
      />
    </motion.div>
  )
}

export default ExpandCollapseButton