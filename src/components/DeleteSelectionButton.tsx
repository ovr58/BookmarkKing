import { MdDeleteForever } from "react-icons/md"
import { motion } from "framer-motion"

interface DeleteSelectionButtonProps {
  onClick: () => void;
}

function DeleteSelectionButton({ onClick }: DeleteSelectionButtonProps) {
  return (
    <motion.div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      onClick={onClick} 
      initial={{ scale: 0.2 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.2 }}
      transition={{ duration: 0.3 }}
      key="delete-button-motion"
      title={chrome.i18n.getMessage('deleteSelection')} 
    >
      <MdDeleteForever className="w-full p-1 h-auto object-fit rounded-full dark:fill-light fill-dark cursor-pointer" aria-label="bookmark delete" />
    </motion.div>
  )
}

export default DeleteSelectionButton