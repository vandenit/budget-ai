import React from 'react';

// Reusable form field components
export const FormField = ({ 
    label, 
    required = false, 
    children 
}: { 
    label: string; 
    required?: boolean; 
    children: React.ReactNode; 
}) => (
    <div className="form-control">
        <label className="label">
            <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
            </span>
        </label>
        {children}
    </div>
);

export const NumberInput = ({ 
    value, 
    onChange, 
    placeholder, 
    required = false 
}: { 
    value: number; 
    onChange: (value: number) => void; 
    placeholder?: string; 
    required?: boolean; 
}) => (
    <input
        type="number"
        step="0.01"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input input-bordered w-full"
        placeholder={placeholder}
        required={required}
    />
);

export const TextInput = ({ 
    value, 
    onChange, 
    placeholder, 
    required = false 
}: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder?: string; 
    required?: boolean; 
}) => (
    <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full"
        placeholder={placeholder}
        required={required}
    />
);

export const DateInput = ({ 
    value, 
    onChange, 
    required = false 
}: { 
    value: string; 
    onChange: (value: string) => void; 
    required?: boolean; 
}) => (
    <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full"
        required={required}
    />
);

export const SelectInput = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    required = false 
}: { 
    value: string; 
    onChange: (value: string) => void; 
    options: { value: string; label: string }[]; 
    placeholder?: string; 
    required?: boolean; 
}) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered w-full"
        required={required}
    >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
);
