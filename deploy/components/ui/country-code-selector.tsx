'use client';

import React, { useState, useRef, useEffect } from 'react';
import { COUNTRY_CODES, CountryCode } from '@/constants/country-codes';
import { ChevronDown, Search } from 'lucide-react';

interface CountryCodeSelectorProps {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  className?: string;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: CountryCode) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Country Display */}
             <button
         type="button"
         onClick={() => setIsOpen(!isOpen)}
         className="flex items-center justify-between w-full px-2 py-2 text-sm border border-border-color rounded-l-md bg-background text-text-primary hover:bg-accent-color/10 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent min-w-[60px]"
       >
        <div className="flex items-center space-x-1">
          <span className="text-lg">{value.flag}</span>
        </div>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

             {/* Dropdown */}
       {isOpen && (
         <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card-bg border border-border-color rounded-md shadow-lg max-h-60 overflow-hidden">
           {/* Search Input */}
           <div className="p-2 border-b border-border-color">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
               <input
                 type="text"
                 placeholder="Search countries..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-3 py-2 text-sm border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary placeholder-text-muted"
                 autoFocus
               />
             </div>
           </div>

           {/* Country List */}
           <div className="max-h-48 overflow-y-auto">
             {filteredCountries.length === 0 ? (
               <div className="px-3 py-2 text-sm text-text-muted">
                 No countries found
               </div>
             ) : (
               filteredCountries.map((country) => (
                 <button
                   key={country.code}
                   type="button"
                   onClick={() => handleCountrySelect(country)}
                   className={`w-full px-3 py-2 text-sm text-left hover:bg-accent-color/10 flex items-center space-x-3 ${
                     country.code === value.code ? 'bg-accent-color text-white' : 'text-text-primary'
                   }`}
                 >
                   <span className="text-lg">{country.flag}</span>
                   <div className="flex-1">
                     <div className="font-medium text-sm">{country.dialCode}</div>
                     <div className="text-xs text-text-muted">{country.name}</div>
                   </div>
                 </button>
               ))
             )}
           </div>
         </div>
       )}
    </div>
  );
}; 