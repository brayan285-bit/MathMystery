import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-300 text-sm font-bold mb-2 font-display">
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-lg bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-600'} focus:border-mystery-accent focus:ring-2 focus:ring-mystery-accent/50 outline-none transition-all text-white placeholder-gray-500 ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};