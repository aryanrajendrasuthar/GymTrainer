"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, TrendingUp, Heart, Settings } from "lucide-react";
import { cn } from "@/app/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Train" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/physio", icon: Heart, label: "Physio" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-trainer-surface/95 backdrop-blur-xl border-t border-white/8 pb-safe"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center relative"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1 : 1,
                  y: isActive ? -1 : 0,
                }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-1.5 bg-trainer-indigo/15 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={cn(
                      "relative z-10 transition-colors duration-200",
                      isActive ? "text-trainer-indigo" : "text-white/40"
                    )}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-200",
                    isActive ? "text-trainer-indigo" : "text-white/40"
                  )}
                >
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
