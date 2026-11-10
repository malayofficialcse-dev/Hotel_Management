import Link from "next/link";
import { FigmaIcon } from "@/components/figma-icon";

const steps = [
  { title: "Choose room", href: "/booking/room" },
  { title: "Guest details", href: "/booking/guest" },
  { title: "Review booking", href: "/booking/review" },
  { title: "Payment", href: "/booking/payment" },
  { title: "Confirmation", href: "/booking/confirmation" },
];

export function BookingStepper({ active }: { active: number }) {
  return (
    <nav className="bg-mist" aria-label="Booking progress">
      <ol className="mx-auto flex max-w-[1296px] items-center gap-2 overflow-x-auto px-5 py-4 lg:px-0">
        {steps.map((step, index) => {
          const current = index === active;
          const complete = index < active;
          return (
            <li key={step.title} className="flex min-w-[145px] flex-1 items-center gap-2">
              <Link
                href={step.href}
                aria-current={current ? "step" : undefined}
                className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  current
                    ? "bg-forest text-white"
                    : complete
                      ? "bg-mint text-forest"
                      : "border border-line bg-white text-muted"
                }`}
              >
                {complete ? <FigmaIcon name="check" className="h-3 w-3" /> : index + 1}
              </Link>
              <Link
                href={step.href}
                className={`whitespace-nowrap text-[11px] ${
                  current ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {step.title}
              </Link>
              {index < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
