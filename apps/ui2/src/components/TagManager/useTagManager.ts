import { useState, useEffect, useRef } from 'react';
import { useCombobox } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Tag } from '@/types/tag';
import { searchTags, createTag } from '@/api/tagsApi';
import { CREATE_PREFIX } from './constants';
import { SelectOption } from './types';

interface UseTagManagerProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  disabled: boolean;
}

export function useTagManager({ tags, onChange, disabled }: UseTagManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const combobox = useCombobox({
    onDropdownClose: () => {
      // Don't interfere with manual closing - let the handlers manage state
    },
  });

  // Fetch tags when search changes
  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      searchTags(debouncedSearch)
        .then(setAvailableTags)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [debouncedSearch, isEditing]);

  // Load initial tags when entering edit mode
  useEffect(() => {
    if (isEditing && availableTags.length === 0 && !debouncedSearch) {
      setIsLoading(true);
      searchTags()
        .then(setAvailableTags)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isEditing, availableTags.length, debouncedSearch]);

  // Open combobox and focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      combobox.openDropdown();
      // Focus the input after a brief delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isEditing, combobox]);

  const handleRemoveTag = (tagId: string) => {
    if (disabled) return;
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    onChange(updatedTags);
  };

  const handleCreateTag = async (tagName: string) => {
    setIsCreating(true);
    try {
      const newTag = await createTag(tagName);
      onChange([...tags, newTag]);
      setSearchValue('');
      combobox.closeDropdown();
      setIsEditing(false);
      // Refresh available tags
      const updatedTags = await searchTags();
      setAvailableTags(updatedTags);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddExistingTag = (tag: Tag) => {
    if (!tags.some(t => t.id === tag.id)) {
      onChange([...tags, tag]);
      setSearchValue('');
      combobox.closeDropdown();
      setIsEditing(false);
    }
  };

  const handleOptionSubmit = (value: string) => {
    if (value.startsWith(CREATE_PREFIX)) {
      const tagName = value.substring(CREATE_PREFIX.length);
      handleCreateTag(tagName);
    } else {
      const selectedTag = availableTags.find(t => t.id === value);
      if (selectedTag && !tags.some(t => t.id === selectedTag.id)) {
        handleAddExistingTag(selectedTag);
      }
    }
  };

  const handleEnterKey = async () => {
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    // Check for exact match (case-insensitive)
    const exactMatch = availableTags.find(
      tag => tag.name.toLowerCase() === trimmed.toLowerCase() && !tags.some(t => t.id === tag.id)
    );

    if (exactMatch) {
      // Select the exact match
      handleAddExistingTag(exactMatch);
    } else {
      // Create new tag
      await handleCreateTag(trimmed);
    }
  };

  // Prepare data for MultiSelect
  const selectData: SelectOption[] = availableTags
    .filter(tag => !tags.some(t => t.id === tag.id))
    .map(tag => ({
      value: tag.id,
      label: tag.name,
    }));

  // Add "Create new tag" option if search doesn't match any existing tags
  const trimmedSearch = searchValue.trim();
  const hasExactMatch = availableTags.some(
    tag => tag.name.toLowerCase() === trimmedSearch.toLowerCase()
  );
  
  if (trimmedSearch && !hasExactMatch && !isLoading) {
    selectData.unshift({
      value: `${CREATE_PREFIX}${trimmedSearch}`,
      label: `+ Create "${trimmedSearch}"`,
    });
  }

  return {
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
  };
}

