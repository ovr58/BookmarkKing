import React, { useMemo } from "react";
import SelectAllButton from "./SelectAllButton";
import ExpandCollapseButton from "./ExpandCollapseButton";
import DeleteSelectionButton from "./DeleteSelectionButton";
import SortButton from "./SortButton";
import ColorButton from "./ColorButton";
import { AnimatePresence, motion } from "framer-motion";
import AddBookmarkButton from "./AddBookmarkButton";

interface UiContainerProps {
    bookmarkState: { [key: string]: {isOpen: boolean, isSelected: boolean, color: string} };
    handleSellectByCommand: (commandKey: string) => void;
    handleExpandByCommand: (commandKey: string) => void;
    handleDelete: () => void;
    handleColorChange: (color: string) => void;
    handleAddBookmark: () => void;
    sortedOrder: boolean[];
    setSortType: React.Dispatch<React.SetStateAction<boolean[]>>;
}

const UiContainer: React.FC<UiContainerProps> = ({
    bookmarkState,
    handleSellectByCommand,
    handleExpandByCommand,
    handleDelete,
    handleColorChange,
    handleAddBookmark,
    sortedOrder,
    setSortType
}) => {

    const isAllExpanded = useMemo(() => Object.keys(bookmarkState).every((key: string) => bookmarkState[key].isOpen), [bookmarkState]);

    const isAnyExpanded = useMemo(() => Object.keys(bookmarkState).some((key: string) => bookmarkState[key].isOpen), [bookmarkState]);

    const isAnySelected = useMemo(() => Object.keys(bookmarkState).some((key: string) => bookmarkState[key].isSelected), [bookmarkState]);

    const isAllSelected = useMemo(() => Object.keys(bookmarkState).every((key: string) => bookmarkState[key].isSelected), [bookmarkState]);

    const colorsInUse = useMemo(() =>
        // get all unic colors in use
        Array.from(new Set(
            Object.keys(bookmarkState).map((key: string) => bookmarkState[key].color)
        )), [bookmarkState]
    );

    return (
        <div className="relative z-50 flex flex-row justify-start items-start gap-[5px] p-2 w-full h-auto mb-2 max-w-2xl mx-auto rounded-lg transform transition-all duration-150 ease-in-out overflow-visible">
        <AnimatePresence key='select-expand-collapse-sort-animate-presence'>
        <motion.div
            className="flex gap-[5px]"
            initial={{ scale: 0.2 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.2 }}
            transition={{ duration: 0.2 }}
            key='select-expand-collapse-sort-motion'
        >
            <AddBookmarkButton onClick={handleAddBookmark} />
            <SelectAllButton 
                onClick = {handleSellectByCommand}
                isAnySelected={isAnySelected}
                isAllSelected={isAllSelected}
                colorsInUse={colorsInUse}                    
            />
            <ExpandCollapseButton 
                onClick = {handleExpandByCommand}
                isAnySelected={isAnySelected}
                isAllExpanded={isAllExpanded}
                isAnyExpanded={isAnyExpanded}
                colorsInUse={colorsInUse}    
            />
            <SortButton onClick={setSortType} sortedOrder={sortedOrder}/>
        </motion.div>
        {isAnySelected &&
        <motion.div
            className="flex gap-[5px]"
            initial={{ scale: 0.2 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.2 }}
            transition={{ duration: 0.2 }}
            key='delete-and-picker-motion'
        >
            <DeleteSelectionButton onClick={handleDelete}/>

            <ColorButton handleColorChange={(color) => handleColorChange(color)} />
        </motion.div>
        }
        </AnimatePresence>
        
        </div>
    );
}

export default UiContainer;