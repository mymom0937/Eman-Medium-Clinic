"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { assets } from "@/assets/assets";

// Social media image variants expected in assets:
// github1 (light), github2 (dark), linkedin1, linkedin2, whatsapp, whatsapp1, telegram1, telegram2 (add to assets if not present)

interface SocialItem {
  name: string;
  href: string;
  getSrc: (isDark: boolean) => string;
  sizeClass: string; // width class (w-6 / w-8 etc.)
  alt: string;
}

const socialItems: SocialItem[] = [
  {
    name: "GitHub",
    href: "https://github.com/mymom0937",
    getSrc: () => assets.github_icon,
    sizeClass: "w-7",
    alt: "GitHub",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/seid-endris-dev/",
    getSrc: () => assets.linkedin_icon,
    sizeClass: "w-6",
    alt: "LinkedIn",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/251937597917",
    getSrc: () => assets.whatsapp_icon,
    sizeClass: "w-6",
    alt: "WhatsApp",
  },
  {
    name: "Telegram",
    href: "https://t.me/your_username", // TODO: replace with real username
    getSrc: () => assets.telegram_icon,
    sizeClass: "w-6",
    alt: "Telegram",
  },
];

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const copyrightText = `© ${currentYear}, EzCart. All rights reserved.`;

  return (
    <footer
      className={`border-t transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#111827] border-gray-800 text-gray-300"
          : "bg-white border-gray-200 text-gray-600"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group bg-[#3471D5] rounded-md p-2"
          >
            <Image
              src={
                theme === "dark"
                  ? assets.ezcart_logo_white
                  : assets.ezcart_logo_dark
              }
              alt="Eman Clinic Logo"
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>

          {/* Center: Legal Links + Copyright */}
          <div className="flex flex-col items-center gap-3 order-last md:order-none">
            <nav aria-label="Footer navigation">
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-teal-500 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li className="hidden sm:block select-none text-gray-400">|</li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-teal-500 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li className="hidden sm:block select-none text-gray-400">|</li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-teal-500 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>
            <p className="text-xs md:text-sm text-center leading-relaxed tracking-wide">
              {copyrightText}
            </p>
            <p className="text-[11px] md:text-xs text-center mt-1 text-gray-400 dark:text-gray-500">
              Designed &amp; developed by{" "}
              <a
                href="https://www.linkedin.com/in/seid-endris-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F8BD19] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#F8BD19]/40 rounded-sm"
              >
                Seid Endris
              </a>
            </p>
          </div>

          {/* Right: Social */}
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-3 justify-center">
              {socialItems.map((item) => {
                const src = item.getSrc(theme === "dark");
                if (!src) return null;
                return (
                  <li key={item.name}>
                    <Link
                      target="_blank"
                      href={item.href}
                      aria-label={item.name}
                      className="group"
                    >
                      <Image
                        src={src}
                        alt={item.alt}
                        className={`${item.sizeClass} cursor-pointer hover:-translate-y-1 duration-500 rounded-sm object-contain`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
