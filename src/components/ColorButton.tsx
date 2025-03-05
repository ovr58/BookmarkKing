import { IoColorPaletteOutline } from "react-icons/io5";
import { BlockPicker } from "react-color";
import { useState } from "react";

interface ColorButtonProps {
  handleColorChange: (color: string) => void;
  firstSelectedColor: string;
}

const presetColors = [
  '#FF5733', // Красный
  '#FF8D1A', // Оранжевый
  '#FFC300', // Желтый
  '#28A745', // Зеленый
  '#17A2B8', // Голубой
  '#007BFF', // Синий
  '#6F42C1', // Фиолетовый
  '#E83E8C', // Розовый
  '#8B4513', // Коричневый
  '#6C757D'  // Серый
];

function ColorButton({ handleColorChange, firstSelectedColor }: ColorButtonProps) {

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  return (
    <div className="relative">
    <div className='bg-blue-900 rounded-full w-[36px] h-auto border-2 border-white hover:animate-pulse transform hover:scale-105 hover:border-b-blue-300 cursor-pointer transition-all duration-150 ease-in-out' onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} >
      <IoColorPaletteOutline className="w-full p-1 h-auto object-fit rounded-full fill-white cursor-pointer" aria-label="bookmark color" />
    </div>
    {isColorPickerOpen && 
    <BlockPicker 
      key='colorPicker'
      className='absolute top-6'
      colors={presetColors}
      color={firstSelectedColor}
      onChangeComplete={(color) => handleColorChange(color.hex)} 
    />}
    </div>
)
}

export default ColorButton