import Link from "next/link";
import type { ReactNode } from "react";

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "outline" | "soft";
  className?: string;
  type?: "button" | "submit";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[4px] px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-forest text-white hover:bg-[#3d594b]",
    outline: "border border-line bg-white text-ink hover:border-forest hover:text-forest",
    soft: "bg-mint text-forest hover:bg-[#d7eee2]",
  };
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export function Surface({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-[4px] border border-line bg-white ${className}`} {...props}>
      {children}
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="mb-2 text-[10px] font-bold tracking-[1.4px] text-forest">{eyebrow}</p>
      )}
      <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.7px] text-ink sm:text-[32px]">
        {title}
      </h1>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  );
}

export function TextField({
  label,
  className = "",
  ...props
}: {
  label: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block text-[11px] font-medium text-ink ${className}`}>
      {label}
      <input
        className="mt-2 h-10 w-full rounded-[4px] border border-line bg-white px-3 text-xs font-normal text-ink placeholder:text-muted"
        {...props}
      />
    </label>
  );
}

export function SelectField({
  label,
  options,
  className = "",
}: {
  label: string;
  options: string[];
  className?: string;
}) {
  return (
    <label className={`block text-[11px] font-medium text-ink ${className}`}>
      {label}
      <select className="mt-2 h-10 w-full rounded-[4px] border border-line bg-white px-3 text-xs font-normal text-ink">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
