import { BsCheckAll } from "react-icons/bs";

interface SelectAllButtonProps {
  onClick: () => void
}

function SelectAllButton({ onClick }: SelectAllButtonProps) {
  return (
    <div 
      className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
      onClick={onClick} 
      key='select-all-button-container'
      title={chrome.i18n.getMessage('selectAll')  }
    >
        <BsCheckAll className="w-full p-1 h-auto object-fit rounded-full dark:fill-light fill-dark cursor-pointer" aria-label="bookmark select" />
    </div>
  )
}

export default SelectAllButton