// components/autocomplete-input.tsx
'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl } from '@/components/ui/form';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  placeholder?: string;
  dataSource: string | string[]; // File path or array of suggestions
  maxSuggestions?: number;
  icon?: ReactNode;
  suggestionIcon?: ReactNode;
  className?: string;
  inputClassName?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder = "Type to search...",
  dataSource,
  maxSuggestions = 5,
  icon,
  suggestionIcon,
  className = "",
  inputClassName = "",
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allItems, setAllItems] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load items from data source (file or array)
  useEffect(() => {
    const loadItems = async () => {
      try {
        if (typeof dataSource === 'string' && dataSource.endsWith('.txt')) {
          // Load from file using fetch (works for public files in web apps)
          try {
            const response = await fetch(dataSource);
            if (!response.ok) throw new Error('Failed to fetch file');
            const content = await response.text();
            const items = content.split('\n').filter(item => item.trim() !== '');
            setAllItems(items);
            console.log('Items loaded from file:', items);
          } catch (err) {
            console.error('Error fetching file:', err);
            setAllItems([]);
          }
        } else if (Array.isArray(dataSource)) {
          // Use provided array
          setAllItems(dataSource);
        }
      } catch (error) {
        console.error('Error loading autocomplete data:', error);
        // If dataSource is a string but not a valid file, use it as a single item
        if (typeof dataSource === 'string' && !Array.isArray(dataSource)) {
          setAllItems([dataSource]);
        } else {
          setAllItems([]);
        }
      }
    };

    loadItems();
  }, [dataSource]);

  // Filter items based on input
  useEffect(() => {
    if (value) {
      const filtered = allItems
        .filter(item => 
          item.toLowerCase().includes(value.toLowerCase()))
        .slice(0, maxSuggestions);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, allItems, maxSuggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <FormControl>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => value && suggestions.length > 0 && setIsOpen(true)}
            onBlur={onBlur}
            name={name}
            className={`${icon ? 'pl-8' : ''} text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 ${inputClassName}`}
          />
        </FormControl>
        {icon && (
          <div className="absolute left-2 top-2.5 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-accent cursor-pointer flex items-center"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestionIcon && (
                <span className="mr-2 text-muted-foreground">
                  {suggestionIcon}
                </span>
              )}
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}