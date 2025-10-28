import { TagManagerProps } from './types';
import { useTagManager } from './useTagManager';
import { TagDisplay } from './TagDisplay';
import { TagInput } from './TagInput';

export function TagManager({ 
  tags, 
  onChange, 
  placeholder = 'Add tags...', 
  disabled = false 
}: TagManagerProps) {
  const {
    isEditing,
    setIsEditing,
    searchValue,
    setSearchValue,
    isLoading,
    isCreating,
    containerRef,
    inputRef,
    combobox,
    selectData,
    handleRemoveTag,
    handleOptionSubmit,
    handleEnterKey,
  } = useTagManager({ tags, onChange, disabled });

  const handleExitEditMode = () => {
    setIsEditing(false);
    setSearchValue('');
  };

  if (isEditing) {
    return (
      <TagInput
        placeholder={placeholder}
        disabled={disabled}
        isCreating={isCreating}
        isLoading={isLoading}
        searchValue={searchValue}
        selectData={selectData}
        containerRef={containerRef}
        inputRef={inputRef}
        combobox={combobox}
        onSearchChange={setSearchValue}
        onOptionSubmit={handleOptionSubmit}
        onEnterKey={handleEnterKey}
        onExitEditMode={handleExitEditMode}
      />
    );
  }

  return (
    <TagDisplay
      tags={tags}
      placeholder={placeholder}
      disabled={disabled}
      containerRef={containerRef}
      onEnterEditMode={() => setIsEditing(true)}
      onRemoveTag={handleRemoveTag}
    />
  );
}

