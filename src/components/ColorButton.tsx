import { IoColorPaletteOutline } from "react-icons/io5";

interface ColorButtonProps {
  onClick: () => void
}

function ColorButton({ onClick }: ColorButtonProps) {
  return (
    <div className='bg-blue-900 rounded-full w-[36px] h-auto border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out' onClick={onClick} >
      <IoColorPaletteOutline className="w-full p-1 h-auto object-fit rounded-full fill-white cursor-pointer" aria-label="bookmark color" />
    </div>
  )
}

export default ColorButton