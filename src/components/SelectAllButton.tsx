
interface SelectAllButtonProps {
  onClick: () => void
}

function SelectAllButton({ onClick }: SelectAllButtonProps) {
  return (
    <div className='cursor-pointer' onClick={onClick}>SA</div>
  )
}

export default SelectAllButton