import { TextInput, CloseButton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface QuestionsSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  isLoading?: boolean;
}

export function QuestionsSearchBar({
  searchTerm,
  setSearchTerm,
  clearSearch,
  isLoading,
}: QuestionsSearchBarProps) {
  return (
    <TextInput
      placeholder="Search questions..."
      size="sm"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      leftSection={<IconSearch size={16} />}
      rightSection={
        searchTerm ? (
          <CloseButton
            size="sm"
            onClick={clearSearch}
            aria-label="Clear search"
          />
        ) : null
      }
      styles={{
        input: {
          backgroundColor: 'white',
        },
      }}
    />
  );
}
