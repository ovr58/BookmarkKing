import { BsCheckAll } from "react-icons/bs";

interface SelectAllButtonProps {
  onClick: () => void
}

function SelectAllButton({ onClick }: SelectAllButtonProps) {
  return (
    <div className='bg-blue-900 rounded-full w-[36px] h-auto border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out' onClick={onClick} >
        <BsCheckAll className="w-full p-1 h-auto object-fit rounded-full fill-white cursor-pointer" aria-label="bookmark select" />
    </div>
  )
}

export default SelectAllButton