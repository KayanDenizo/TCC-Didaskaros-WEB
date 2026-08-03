import { useState } from "react";

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-blue-500 ml-1">*</span>}
    </label>
  );
}

export function Input({
  value, onChange, placeholder, type = "text", error, hint, disabled, maxLength,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; error?: string; hint?: string; disabled?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-4 py-2.5 rounded-xl border text-[13px] font-medium text-gray-800
          placeholder-gray-300 outline-none transition-all bg-white
          ${error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          }
          ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}
        `}
      />
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function PasswordInput({
  value, onChange, placeholder, error, hint,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-4 pr-20 py-2.5 rounded-xl border text-[13px] font-medium text-gray-800
            placeholder-gray-300 outline-none transition-all bg-white
            ${error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-blue-500 hover:text-blue-700 transition-colors"
        >
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Select({
  value, onChange, options, placeholder, error,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string; error?: string;
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border text-[13px] font-medium
          outline-none transition-all bg-white appearance-none cursor-pointer
          ${value === "" ? "text-gray-300" : "text-gray-800"}
          ${error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          }
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export function CheckboxGroup({
  options, selected, onChange, error,
}: {
  options: string[]; selected: string[];
  onChange: (v: string[]) => void; error?: string;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all
                ${active
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

export function SectionTitle({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[13px] font-black shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
