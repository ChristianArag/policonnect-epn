"use client";

import React from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  GraduationCap,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import type { ApplicationStatus, UserRole } from "@/types/policonnect";

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return withTime
    ? date.toLocaleString("es-EC", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString("es-EC", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white shadow-sm",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-gray-900/5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003876] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#003876] text-white shadow-sm hover:bg-[#002855] hover:shadow-md active:scale-[0.98]",
  secondary:
    "border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-[#003876]/30 hover:bg-blue-50/30",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-[#003876]",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
  icon: "h-10 w-10",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Formularios                                                                 */
/* -------------------------------------------------------------------------- */

export const inputClass =
  "block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:bg-gray-50";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export function IconInput({
  icon: Icon,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input className={cn(inputClass, "pl-11", className)} {...rest} />
    </div>
  );
}

export function SelectInput({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputClass, "cursor-pointer appearance-none pr-10", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

export type Tone = "gray" | "indigo" | "green" | "amber" | "red" | "violet";

const BADGE_TONES: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-600",
  indigo: "bg-indigo-50 text-indigo-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
};

export function Badge({
  tone = "gray",
  icon: Icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium",
        BADGE_TONES[tone],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "En revisión",
  "Entrevistado",
  "Seleccionado",
  "Rechazado",
];

export const STATUS_META: Record<
  ApplicationStatus,
  { tone: Tone; icon: React.ElementType; select: string }
> = {
  "En revisión": {
    tone: "amber",
    icon: Clock,
    select: "border-amber-200 bg-amber-50 text-amber-800 focus:ring-amber-500/20",
  },
  Entrevistado: {
    tone: "indigo",
    icon: Users,
    select: "border-indigo-200 bg-indigo-50 text-indigo-800 focus:ring-indigo-500/20",
  },
  Seleccionado: {
    tone: "green",
    icon: CheckCircle2,
    select: "border-emerald-200 bg-emerald-50 text-emerald-800 focus:ring-emerald-500/20",
  },
  Rechazado: {
    tone: "red",
    icon: XCircle,
    select: "border-red-200 bg-red-50 text-red-700 focus:ring-red-500/20",
  },
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as string[]).includes(value);
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {status}
    </Badge>
  );
}

export function MatchBadge({ score }: { score: number }) {
  return (
    <Badge tone={score >= 85 ? "green" : "indigo"} icon={TrendingUp}>
      {score}% match
    </Badge>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return (
      <Badge tone="green" icon={ShieldCheck}>
        Administrador
      </Badge>
    );
  }
  if (role === "EPN_STUDENT") {
    return (
      <Badge tone="indigo" icon={GraduationCap}>
        Estudiante EPN
      </Badge>
    );
  }
  return (
    <Badge tone="violet" icon={Globe}>
      Externo
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar, íconos y marca                                                      */
/* -------------------------------------------------------------------------- */

const AVATAR_SIZES = {
  sm: "h-8 w-8 rounded-lg text-xs",
  md: "h-10 w-10 rounded-xl text-sm",
  lg: "h-16 w-16 rounded-2xl text-lg",
  xl: "h-24 w-24 rounded-2xl text-2xl",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-indigo-50 font-semibold text-indigo-600",
        AVATAR_SIZES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name) || "?"
      )}
    </div>
  );
}

const TILE_TONES: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-500",
  indigo: "bg-indigo-50 text-indigo-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
};

export function IconTile({
  icon: Icon,
  tone = "indigo",
  className,
}: {
  icon: React.ElementType;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        TILE_TONES[tone],
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Logo                                                                        */
/* -------------------------------------------------------------------------- */

export function Logo({
  subtitle = true,
  theme = "light",
}: {
  subtitle?: boolean;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold tracking-tight shadow-sm",
          isDark ? "bg-white text-[#003876]" : "bg-[#003876] text-white"
        )}
      >
        PC
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "text-base font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            PoliConnect
          </p>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold border",
              isDark
                ? "bg-white/15 text-white border-white/20"
                : "bg-blue-50 text-[#003876] border-blue-100"
            )}
          >
            EPN
          </span>
        </div>
        {subtitle && (
          <p className={cn("text-xs", isDark ? "text-blue-200" : "text-gray-500")}>
            Bolsa de Empleo FIS
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs segmentadas                                                            */
/* -------------------------------------------------------------------------- */

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  fullWidth = false,
  variant = "light",
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  fullWidth?: boolean;
  variant?: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";
  return (
    <div
      className={cn(
        "gap-1 rounded-xl p-1",
        isDark ? "bg-[#002855]/70 border border-white/10" : "bg-gray-100",
        fullWidth ? "flex w-full" : "inline-flex",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
              fullWidth && "flex-1",
              active
                ? isDark
                  ? "bg-white text-[#003876] font-bold shadow-sm"
                  : "bg-white text-[#003876] font-bold shadow-sm"
                : isDark
                ? "text-blue-100 hover:text-white hover:bg-white/10"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-xs",
                  active
                    ? "bg-blue-50 text-[#003876]"
                    : isDark
                    ? "bg-white/10 text-blue-100"
                    : "bg-gray-200/70 text-gray-500"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Estados vacíos y toast                                                      */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <IconTile icon={icon} tone="gray" />
      <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="animate-slide-up fixed inset-x-4 bottom-6 z-[60] flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg shadow-gray-900/5 sm:inset-x-auto sm:right-6 sm:max-w-sm"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
      <p className="text-sm text-gray-700">{message}</p>
    </div>
  );
}
