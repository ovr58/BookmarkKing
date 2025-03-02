import React from "react";
import SelectAllButton from "./SelectAllButton";
import ExpandCollapseButton from "./ExpandCollapseButton";
import DeleteSelectionButton from "./DeleteSelectionButton";
import SortButton from "./SortButton";
// import ColorButton from "./ColorButton";

interface UiContainerProps {
    bookmarkState: { [key: string]: {isOpen: boolean, isSelected: boolean} };
    setBookmarkState: React.Dispatch<React.SetStateAction<{ [key: string]: {isOpen: boolean, isSelected: boolean} }>>;
    handleDelete: () => void;
    setSortType: React.Dispatch<React.SetStateAction<'color' | 'timedisc' | 'timeasc'>>;
}

const UiContainer: React.FC<UiContainerProps> = ({
    bookmarkState,
    setBookmarkState,
    handleDelete,
    setSortType
}) => {

    console.log('UI CONTAINER:', bookmarkState)

    return (
        <div className="flex flex-row justify-start items-start gap-[5px] p-2 w-full h-auto mb-2 max-w-2xl mx-auto rounded-lg overflow-hidden">
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
            })}/>
            <DeleteSelectionButton onClick={handleDelete}/>
            <SortButton onClick={(() => {
                    setSortType((prevSortType) => {
                        if (prevSortType === 'color') {
                            return 'timeasc';
                        } else if (prevSortType === 'timeasc') {
                            return 'timedisc';
                        }
                        return 'color';
                    })
            })}/>
            {/* <ColorButton /> */}
        </div>
    );
}

export default UiContainer;