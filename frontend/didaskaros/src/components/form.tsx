import { useState, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClass = (error?: string) =>
  `w-full px-4 py-2.5 rounded-xl border text-[13px] font-medium text-gray-800 bg-white placeholder-gray-300 outline-none transition-all
   disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2
   ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"}`;

/** label + campo + msg de erro/dica */
export function Field({ label, required, error, hint, className = "", children }: {
  label: string; required?: boolean; error?: string; hint?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={className} data-error={!!error}>
      <label className="block text-[12px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-blue-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string | number;
  onChange: (v: string) => void;
  error?: string;
};

export function Input({ onChange, error, className = "", ...props }: InputProps) {
  return <input {...props} onChange={(e) => onChange(e.target.value)} className={`${inputClass(error)} ${className}`} />;
}

export function PasswordInput(props: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-20" />
      <button type="button" onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-blue-500 hover:text-blue-700">
        {show ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, error, disabled }: {
  value: string | number;
  onChange: (v: string) => void;
  options: readonly (string | { value: string | number; label: string })[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className={`${inputClass(error)} cursor-pointer ${value === "" ? "text-gray-400" : ""}`}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const { value: v, label } = typeof o === "string" ? { value: o, label: o } : o;
        return <option key={v} value={v}>{label}</option>;
      })}
    </select>
  );
}

/** grupo de botoes liga/desliga (da pra marcar varios) */
export function Chips<T extends string | number>({ options, selected, onChange, label = String }: {
  options: readonly T[];
  selected: T[];
  onChange: (v: T[]) => void;
  label?: (v: T) => string;
}) {
  const toggle = (o: T) => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${selected.includes(o)
            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
            : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"}`}>
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[13px] font-black shrink-0 mt-0.5">{step}</div>
      <div>
        <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
