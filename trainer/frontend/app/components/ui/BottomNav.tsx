"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Bot, Heart, Settings } from "lucide-react";
import { cn } from "@/app/lib/utils";

const navItems = [
  { href: "/dashboard",  icon: Home,     label: "Home" },
  { href: "/coach",      icon: Bot,      label: "Coach" },
  { href: "/workout",    icon: Dumbbell, label: "Train" },
  { href: "/physio",     icon: Heart,    label: "Physio" },
  { href: "/settings",   icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-trainer-surface/95 backdrop-blur-xl border-t border-white/8 pb-safe"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          const isTrain = href === "/workout";

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center relative"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.78 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  {/* Shared floating pill — slides between non-train tabs */}
                  {isActive && !isTrain && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute -inset-2 bg-trainer-indigo/12 rounded-[10px]"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  {/* Subtle glow behind active icon */}
                  {isActive && !isTrain && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-trainer-indigo/20 blur-[10px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  {isTrain ? (
                    <motion.div
                      animate={isActive
                        ? { boxShadow: "0 0 18px rgba(108,99,255,0.60)" }
                        : { boxShadow: "none" }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "relative z-10 w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors duration-200",
                        isActive
                          ? "bg-trainer-indigo"
                          : "bg-trainer-indigo/15 border border-trainer-indigo/25"
                      )}
                    >
                      <Icon
                        size={20}
                        className={cn(isActive ? "text-white" : "text-trainer-indigo/70")}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    </motion.div>
                  ) : (
                    <Icon
                      size={22}
                      className={cn(
                        "relative z-10 transition-colors duration-200",
                        isActive ? "text-trainer-indigo" : "text-white/40"
                      )}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                  )}
                </div>
                {!isTrain && (
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-200",
                      isActive ? "text-trainer-indigo" : "text-white/40"
                    )}
                  >
                    {label}
                  </span>
                )}
              </motion.div>

              {/* Active dot at bottom edge */}
              {isActive && !isTrain && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-trainer-indigo"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
