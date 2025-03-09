import React from "react";
import SelectAllButton from "./SelectAllButton";
import ExpandCollapseButton from "./ExpandCollapseButton";
import DeleteSelectionButton from "./DeleteSelectionButton";
import SortButton from "./SortButton";
import ColorButton from "./ColorButton";
import { AnimatePresence, motion } from "framer-motion";

interface UiContainerProps {
    bookmarkState: { [key: string]: {isOpen: boolean, isSelected: boolean, color: string} };
    setBookmarkState: React.Dispatch<React.SetStateAction<{ [key: string]: {isOpen: boolean, isSelected: boolean, color: string} }>>;
    handleDelete: () => void;
    handleColorChange: (color: string) => void;
    setSortType: React.Dispatch<React.SetStateAction<'color' | 'timedisc' | 'timeasc'>>;
}

const UiContainer: React.FC<UiContainerProps> = ({
    bookmarkState,
    setBookmarkState,
    handleDelete,
    handleColorChange,
    setSortType
}) => {

    const [nextSortType, setNextSortType] = React.useState('timedisc');
    const isAnySelected = Object.keys(bookmarkState).some((key: string) => bookmarkState[key].isSelected);
    const firstSelectedColor = isAnySelected ? bookmarkState[Object.keys(bookmarkState).find((key: string) => bookmarkState[key].isSelected)!].color : 'bg-red-600';
    const isAllExpanded = Object.keys(bookmarkState).every((key: string) => bookmarkState[key].isOpen);
    console.log('UI CONTAINER:', bookmarkState)

    return (
        <div className="flex flex-row justify-start items-start gap-[5px] p-2 w-full h-auto mb-2 max-w-2xl mx-auto rounded-lg overflow-hidden transform transition-all duration-150 ease-in-out">
        <AnimatePresence>
        <motion.div
            className="flex gap-[5px]"
            initial={{ scale: 0.2 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.2 }}
            transition={{ duration: 0.2 }}
            key='select-expand-collapse-sort-motion'
        >
            <SelectAllButton onClick = {(() => {
                const newBookmarkState = {...bookmarkState};
                Object.keys(newBookmarkState).forEach((key: string) => {
                    newBookmarkState[key].isSelected = !newBookmarkState[key].isSelected;
                });
                setBookmarkState(newBookmarkState);
            })} />
            <ExpandCollapseButton onClick = {(() => {
                const newBookmarkState = {...bookmarkState};
                Object.keys(newBookmarkState).forEach((key: string) => {
                    newBookmarkState[key].isOpen = !newBookmarkState[key].isOpen;
                });
                setBookmarkState(newBookmarkState);
            })} isAllExpanded={isAllExpanded}/>
            <SortButton onClick={(() => {
                setSortType((sortType) => {
                    if (sortType === 'timeasc') {
                        setNextSortType('color');
                        return 'timedisc';
                    } else if (sortType === 'timedisc') {
                        setNextSortType('timeasc');
                        return 'color';
                    }
                    setNextSortType('timedisc');
                    return 'timeasc';
                })
            })} nextSortType={nextSortType}/>
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

            <ColorButton handleColorChange={(color) => handleColorChange(color)} firstSelectedColor={firstSelectedColor} />
        </motion.div>
        }
        </AnimatePresence>
        </div>
    );
}

export default UiContainer;