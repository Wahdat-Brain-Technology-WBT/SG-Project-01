import React from 'react';

/**
 * Converts Persian and Arabic digits to English digits.
 */
export const toEnglishDigits = (str: string | number | undefined | null): string => {
  if (str === null || str === undefined) return '';
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str.toString();
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(persianNumbers[i], 'g'), i.toString())
             .replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
  }
  return res;
};

/**
 * Global utility to handle "Enter" key navigation in forms.
 * Prevents default submission and focuses the next input/select/button.
 * If it's the last field, it triggers the submit button.
 */
export const handleKeyboardNavigation = (e: React.KeyboardEvent<HTMLFormElement>) => {
  if (e.key === 'Enter') {
    const form = e.currentTarget;
    const focusableElements = Array.from(
      form.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])')
    ) as HTMLElement[];

    const index = focusableElements.indexOf(document.activeElement as HTMLElement);

    // If the currently focused element is already the submit button, let it submit naturally
    if (document.activeElement?.getAttribute('type') === 'submit') {
      return; // Do not prevent default
    }

    e.preventDefault(); // Prevent default form submission for inputs

    if (index > -1 && index < focusableElements.length - 1) {
      // Move focus to the next element
      focusableElements[index + 1].focus();
    } else if (index === focusableElements.length - 1 || index === -1) {
      // If it's the last element, find the submit button and click it programmatically
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.click();
      }
    }
  }
};

interface MagicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

/**
 * A wrapper around standard <input> that instantly converts
 * Persian/Arabic digits to English digits as the user types.
 */
export const MagicInput: React.FC<MagicInputProps> = ({ onChange, onValueChange, value, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const convertedValue = toEnglishDigits(e.target.value);

    // Create a synthetic event to pass down if needed
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: convertedValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    if (onChange) onChange(syntheticEvent);
    if (onValueChange) onValueChange(convertedValue);
  };

  return <input value={value} onChange={handleChange} {...props} />;
};
