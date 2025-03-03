import React from "react";
import SelectAllButton from "./SelectAllButton";
import ExpandCollapseButton from "./ExpandCollapseButton";
import DeleteSelectionButton from "./DeleteSelectionButton";
import SortButton from "./SortButton";
import ColorButton from "./ColorButton";

interface UiContainerProps {
    bookmarkState: { [key: string]: {isOpen: boolean, isSelected: boolean} };
    setBookmarkState: React.Dispatch<React.SetStateAction<{ [key: string]: {isOpen: boolean, isSelected: boolean} }>>;
}

const UiContainer: React.FC<UiContainerProps> = ({
    bookmarkState,
    setBookmarkState
}) => {

    console.log('UI CONTAINER:', bookmarkState)

    return (
        <div className="w-full h-auto mb-2 max-w-2xl mx-auto bg-indigo-600 shadow-lg rounded-lg overflow-hidden">
            <SelectAllButton onClick = {(() => {
                const newBookmarkState = {...bookmarkState};
                Object.keys(newBookmarkState).forEach((key: string) => {
                    newBookmarkState[key].isSelected = !newBookmarkState[key].isSelected;
                });
                setBookmarkState(newBookmarkState);
            })} />
            <ExpandCollapseButton />
            <DeleteSelectionButton />
            <SortButton />
            <ColorButton />
        </div>
    );
}

export default UiContainer;