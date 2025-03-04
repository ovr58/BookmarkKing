import { GrSort } from "react-icons/gr";

interface SortButtonProps {
  onClick: () => void
  nextSortType: string
}

function SortButton({ onClick, nextSortType }: SortButtonProps) {
  return (
    <div className='bg-blue-900 rounded-full w-[36px] h-auto border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out' onClick={onClick} title={`Sort by ${nextSortType}`}>
      <GrSort className="w-full p-1 h-auto object-fit rounded-full stroke-white cursor-pointer" aria-label="bookmark sort type" />
    </div>
  )
}

export default SortButton