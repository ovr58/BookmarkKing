import { IoColorPaletteOutline } from "react-icons/io5";
import { GithubPicker } from "react-color";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ColorButtonProps {
  handleColorChange: (color: string) => void;
}

const presetColors = {
  '#dc2626': 'bg-red-600', // Красный
  '#ea580c': 'bg-orange-600', // Оранжевый
  '#ffc300': 'bg-yellow-400', // Желтый
  '#17a2b8': 'bg-cyan-600', // Циан
  '#28a745': 'bg-green-600', // Зеленый
  '#007bff': 'bg-blue-500', // Синий
  '#6f42c1': 'bg-violet-500', // Фиолетовый
  '#e83e8c': 'bg-pink-500', // Розовый
  '#8b4513': 'bg-yellow-900', // Коричневый
  '#6c757d': 'bg-gray-500'  // Серый
};

function ColorButton({ handleColorChange }: ColorButtonProps) {

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerRef]);

  const handleColorSelect = (color: string) => {
    const selectedColor = presetColors[color as keyof typeof presetColors];
    console.log('Selected color:', selectedColor, 'from:', color);
    if (selectedColor) {
      handleColorChange(selectedColor);
    } else {
      console.error('Selected color not found in presetColors:', color);
    }
    setIsColorPickerOpen(false);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => setIsColorPickerOpen(false), 500);
    setCloseTimeout(timeout);
  };

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  };

  return (
    <>
      <motion.div 
        className='dark:bg-primaryDark bg-primary rounded-full w-[36px] h-auto border-2 dark:border-light border-dark hover:animate-pulse transform hover:scale-105 dark:hover:border-b-blue-300 hover:border-b-blue-900  cursor-pointer transition-all duration-150 ease-in-out' 
        onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
        initial={{ scale: 0.2 }}
        animate={{ scale: 1, rotate: isColorPickerOpen ? 180 : 0 }}
        exit={{ scale: 0.2 }}
        transition={{ duration: 0.3 }}
        key="colorpicker-button-motion"
        title={chrome.i18n.getMessage('colorPicker')  } 
      >
        <IoColorPaletteOutline className="w-full p-1 h-auto object-fit rounded-full dark:fill-light fill-dark stroke-dark dark:stroke-light cursor-pointer" aria-label="bookmark color" />
      </motion.div>
      <AnimatePresence key='colorpicker-animate-presence'>
      {isColorPickerOpen && 
      <motion.div
        ref={pickerRef}
        key="colorpicker-motion"        
        className='absolute right-40 top-6 z-50'
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
      <GithubPicker  
        key='colorPicker'
        colors={Object.keys(presetColors)}
        color='#dc2626'
        onChangeComplete={(color) => handleColorSelect(color.hex)} 
        styles={{
          default: {
            card: {
              boxShadow: 'none',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap'
            },
            triangle: {
              display: 'none'
            }
          }
        }}
      />
      </motion.div>
      }
      </AnimatePresence>
    </>
)
}

export default ColorButton