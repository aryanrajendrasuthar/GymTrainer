"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  TrendingUp,
  Heart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TrainerLogo } from "./TrainerLogo";
import { cn } from "@/app/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Train" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/physio", icon: Heart, label: "Physio" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-trainer-surface border-r border-white/8 shrink-0 z-30 overflow-hidden"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className={cn("flex items-center px-4 py-5 border-b border-white/8", collapsed && "justify-center")}>
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TrainerLogo variant="icon" size={36} />
            </motion.div>
          ) : (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TrainerLogo variant="full" size={32} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-[12px] transition-all duration-200 group",
                isActive
                  ? "bg-trainer-indigo/15 text-trainer-indigo"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                className="shrink-0"
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute right-0 w-0.5 h-6 bg-trainer-indigo rounded-l-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/8 p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full p-2 rounded-[8px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
