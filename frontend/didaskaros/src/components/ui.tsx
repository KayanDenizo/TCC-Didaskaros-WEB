import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Link } from "react-router-dom";
import type { StatusGrade } from "../api/types";
import { STATUS_LABEL } from "../lib/format";

const VARIANTES = {
  primary: "text-white bg-gradient-to-br from-[#1E4DA1] to-blue-600 shadow-[0_2px_12px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] disabled:hover:translate-y-0",
  secondary: "text-gray-700 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-sm disabled:hover:translate-y-0",
  danger: "text-red-600 bg-white border border-red-200 hover:bg-red-50",
};

type Variante = keyof typeof VARIANTES;
const buttonClass = (variant: Variante, className: string) =>
  `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200
   active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTES[variant]} ${className}`;

export function Button({ variant = "secondary", loading, className = "", children, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variante; loading?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button type="button" {...props} disabled={props.disabled || loading} className={buttonClass(variant, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/** link com cara de botao */
export function LinkButton({ to, variant = "secondary", className = "", children }: { to: string; variant?: Variante; className?: string; children: ReactNode }) {
  return <Link to={to} className={buttonClass(variant, className)}>{children}</Link>;
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <span className={`${className} border-2 border-transparent border-t-current border-r-current rounded-full animate-spin inline-block`} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`vidro rounded-2xl ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-100">
      <div>
        <p className="text-[14px] font-bold text-gray-900">{title}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 animate-fade-in-up">
      <div>
        <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}

const STATUS_COR: Record<StatusGrade, string> = {
  PUBLICADA: "bg-emerald-50 text-emerald-700",
  RASCUNHO: "bg-amber-50 text-amber-700",
  ARQUIVADA: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status }: { status: StatusGrade }) {
  return <Badge className={STATUS_COR[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${className}`}>{children}</span>;
}

export function Alert({ tone = "error", title, children }: { tone?: "error" | "warning" | "info"; title?: string; children?: ReactNode }) {
  const cores = {
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-100 text-blue-800",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-[12px] ${cores[tone]}`}>
      {title && <p className="font-bold text-[13px]">{title}</p>}
      {children && <div className={title ? "mt-1" : ""}>{children}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-[13px] text-gray-400">{children}</div>;
}

/** bloco cinza com brilho passando, no formato do q ta carregando */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`esqueleto rounded-lg ${className}`} />;
}

export function Loading() {
  return <div className="flex justify-center py-16 text-blue-600"><Spinner className="w-7 h-7" /></div>;
}
