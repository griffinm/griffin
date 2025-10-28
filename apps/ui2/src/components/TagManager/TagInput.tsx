import { Box, Combobox, TextInput, ComboboxStore } from '@mantine/core';
import { IconTag } from '@tabler/icons-react';
import { SelectOption } from './types';

interface TagInputProps {
  placeholder: string;
  disabled: boolean;
  isCreating: boolean;
  isLoading: boolean;
  searchValue: string;
  selectData: SelectOption[];
  containerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  combobox: ComboboxStore;
  onSearchChange: (value: string) => void;
  onOptionSubmit: (value: string) => void;
  onEnterKey: () => void;
  onExitEditMode: () => void;
}

export function TagInput({
  placeholder,
  disabled,
  isCreating,
  isLoading,
  searchValue,
  selectData,
  containerRef,
  inputRef,
  combobox,
  onSearchChange,
  onOptionSubmit,
  onEnterKey,
  onExitEditMode,
}: TagInputProps) {
  const options = selectData.map((item) => (
    <Combobox.Option 
      value={item.value} 
      key={item.value}
    >
      {item.label}
    </Combobox.Option>
  ));

  return (
    <Box ref={containerRef}>
      <Combobox
        store={combobox}
        onOptionSubmit={onOptionSubmit}
      >
        <Combobox.Target>
          <TextInput
            ref={inputRef}
            placeholder={placeholder}
            value={searchValue}
            onChange={(event) => {
              onSearchChange(event.currentTarget.value);
              combobox.openDropdown();
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={(e) => {
              // Only close if we're not clicking inside the dropdown
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (!relatedTarget || !relatedTarget.closest('[data-combobox-dropdown]')) {
                setTimeout(() => {
                  combobox.closeDropdown();
                  onExitEditMode();
                }, 150);
              }
            }}
            leftSection={<IconTag size={16} />}
            disabled={disabled || isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                combobox.closeDropdown();
                onExitEditMode();
              } else if (e.key === 'Enter' && searchValue.trim()) {
                e.preventDefault();
                onEnterKey();
              }
            }}
          />
        </Combobox.Target>

        <Combobox.Dropdown data-combobox-dropdown>
          <Combobox.Options>
            {isLoading ? (
              <Combobox.Empty>Searching...</Combobox.Empty>
            ) : options.length > 0 ? (
              options
            ) : (
              <Combobox.Empty>Type to create a new tag</Combobox.Empty>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Box>
  );
}

