import React, { useState, useEffect } from 'react';

export interface CountryCode {
    name: string;
    code: string;
    dial: string;
    flag: string;
    placeholder: string;
}

export const COUNTRY_CODES: CountryCode[] = [
    { name: 'Bolivia', code: 'BO', dial: '+591', flag: '🇧🇴', placeholder: '67998576' },
    { name: 'Perú', code: 'PE', dial: '+51', flag: '🇵🇪', placeholder: '987654321' },
    { name: 'Argentina', code: 'AR', dial: '+54', flag: '🇦🇷', placeholder: '91123456789' },
    { name: 'Chile', code: 'CL', dial: '+56', flag: '🇨🇱', placeholder: '912345678' },
    { name: 'Colombia', code: 'CO', dial: '+57', flag: '🇨🇴', placeholder: '3001234567' },
    { name: 'México', code: 'MX', dial: '+52', flag: '🇲🇽', placeholder: '5512345678' },
    { name: 'España', code: 'ES', dial: '+34', flag: '🇪🇸', placeholder: '612345678' },
    { name: 'Estados Unidos', code: 'US', dial: '+1', flag: '🇺🇸', placeholder: '2025550143' },
    { name: 'Brasil', code: 'BR', dial: '+55', flag: '🇧🇷', placeholder: '11987654321' },
    { name: 'Paraguay', code: 'PY', dial: '+595', flag: '🇵🇾', placeholder: '981123456' },
    { name: 'Uruguay', code: 'UY', dial: '+598', flag: '🇺🇾', placeholder: '99123456' },
    { name: 'Ecuador', code: 'EC', dial: '+593', flag: '🇪🇨', placeholder: '991234567' },
    { name: 'Venezuela', code: 'VE', dial: '+58', flag: '🇻🇪', placeholder: '4121234567' },
    { name: 'Panamá', code: 'PA', dial: '+507', flag: '🇵🇦', placeholder: '61234567' },
    { name: 'Costa Rica', code: 'CR', dial: '+506', flag: '🇨🇷', placeholder: '81234567' },
];

interface Props {
    value: string;
    onChange: (fullNumber: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function PhoneCountryInput({
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    className = '',
}: Props) {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // Default Bolivia (+591)
    const [localNumber, setLocalNumber] = useState('');

    // Parse incoming value to split dial code and local number
    useEffect(() => {
        if (!value) {
            setLocalNumber('');
            return;
        }

        const trimmed = value.trim();
        // Check if value starts with any known dial code (e.g. +591 or 591)
        const matchedCountry = COUNTRY_CODES.find((c) => {
            const rawDial = c.dial.replace('+', '');
            return trimmed.startsWith(c.dial) || trimmed.startsWith(`+${rawDial}`) || trimmed.startsWith(rawDial);
        });

        if (matchedCountry) {
            setSelectedCountry(matchedCountry);
            const rawDial = matchedCountry.dial.replace('+', '');
            let remainder = trimmed;
            if (remainder.startsWith(matchedCountry.dial)) {
                remainder = remainder.slice(matchedCountry.dial.length);
            } else if (remainder.startsWith(`+${rawDial}`)) {
                remainder = remainder.slice(rawDial.length + 1);
            } else if (remainder.startsWith(rawDial)) {
                remainder = remainder.slice(rawDial.length);
            }
            setLocalNumber(remainder.trim());
        } else {
            // No dial code matched: assume local number with default selectedCountry (Bolivia)
            setLocalNumber(trimmed.replace(/^\+/, ''));
        }
    }, [value]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const country = COUNTRY_CODES.find((c) => c.code === e.target.value) || COUNTRY_CODES[0];
        setSelectedCountry(country);
        const cleanLocal = localNumber.trim().replace(/\D/g, '');
        if (cleanLocal) {
            onChange(`${country.dial}${cleanLocal}`);
        } else {
            onChange('');
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalNumber(raw);
        const cleanLocal = raw.trim().replace(/\D/g, '');
        if (cleanLocal) {
            onChange(`${selectedCountry.dial}${cleanLocal}`);
        } else {
            onChange('');
        }
    };

    return (
        <div className={`flex rounded-xl border border-slate-300 bg-white shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all ${className}`}>
            {/* Country Selector Dropdown */}
            <div className="relative flex items-center bg-slate-50 border-r border-slate-200">
                <select
                    value={selectedCountry.code}
                    onChange={handleCountryChange}
                    disabled={disabled}
                    className="h-full pl-2.5 pr-6 py-2.5 bg-slate-50 text-gray-900 text-xs sm:text-sm font-semibold border-0 outline-none cursor-pointer appearance-none"
                    aria-label="Seleccionar país y código de área"
                >
                    {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.code} className="text-gray-900 bg-white font-normal py-1">
                            {country.flag} {country.dial} ({country.name})
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                    ▼
                </div>
            </div>

            {/* Local Number Input */}
            <input
                type="tel"
                value={localNumber}
                onChange={handleNumberChange}
                placeholder={placeholder || selectedCountry.placeholder}
                required={required}
                disabled={disabled}
                className="w-full px-3 py-2.5 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm font-medium border-0 outline-none"
            />
        </div>
    );
}
