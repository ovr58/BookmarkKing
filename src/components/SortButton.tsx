import { GrSort } from "react-icons/gr";

interface SortButtonProps {
  onClick: () => void
  nextSortType: string
}

function SortButton({ onClick, nextSortType }: SortButtonProps) {
  return (
    <div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      onClick={onClick} 
      title={chrome.i18n.getMessage(nextSortType)}
      key='sort-button-container'
    >
      <GrSort className="w-full p-1 h-auto object-fit rounded-full dark:stroke-light stroke-dark cursor-pointer" aria-label="bookmark sort type" />
    </div>
  )
}

export default SortButton