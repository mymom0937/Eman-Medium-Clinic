"use client";

import React, { useState, useEffect } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { showSuccess, showError } from "@/lib/toast";
import { getClerkConfig } from "@/lib/config/clerk";

interface IconWrapperProps {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}

const Navbar = () => {
  const {
    user,
    userData,
    userRole,
    handleLogout: contextLogout,
  } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const { openSignIn, signOut } = useClerk();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Helper function to check if a link is active
  const isActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/" || pathname === "";
    }
    if (path === "/about") {
      return pathname === "/about";
    }
    if (path === "/services") {
      return pathname === "/services";
    }
    if (path === "/features") {
      return pathname === "/features";
    }
    if (path === "/contact") {
      return pathname === "/contact";
    }
    return pathname === path;
  };

  // Custom logout handler that also calls our AppContext's handleLogout
  const handleLogout = () => {
    contextLogout();
    showSuccess("Logged out successfully");
  };

  // Mobile menu logout handler
  const handleMobileLogout = async () => {
    try {
      await signOut();
      contextLogout();
      showSuccess("Logged out successfully");
      setIsMenuOpen(false);
    } catch (error) {
      showError("Failed to logout. Please try again.");
    }
  };

  // Icon wrapper component with dark mode support
  const IconWrapper: React.FC<IconWrapperProps> = ({
    src,
    alt,
    onClick,
    className,
  }) => (
    <div
      className={`relative cursor-pointer ${onClick ? "" : ""}`}
      onClick={onClick}
    >
      <div className={`w-5 h-5 relative ${className || ""}`}>
        <Image
          className="w-full h-full object-contain"
          src={src}
          alt={alt}
          style={theme === "dark" ? { filter: "brightness(0) invert(1)" } : {}}
        />
      </div>
    </div>
  );

  // Removed body overflow manipulation to prevent black screen issues
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
      document.documentElement.classList.add("overflow-hidden");
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("menu-open");
    };
  }, [isMenuOpen]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-3 sm:px-6 md:px-8 lg:px-16 xl:px-32 py-3 md:py-4 text-text-primary transition-all duration-300 ${
        isScrolled ? "shadow-xl" : "shadow-lg"
      }`}
      style={{
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
        borderBottom:
          theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
      }}
    >
      {/* Logo */}
      <div
        className={`transition-transform duration-300 ${
          isScrolled ? "scale-95" : "scale-100"
        }`}
      >
        <Link href="/">
          <Image
            className="cursor-pointer w-24 sm:w-28 md:w-28 lg:w-32"
            src={
              isDarkMode ? assets.ezcart_logo_white : assets.ezcart_logo_dark
            }
            alt="EzCart"
            priority
            style={{ filter: "none" }}
          />
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-2 md:gap-4 lg:gap-4 xl:gap-8 ml-8 md:ml-12 lg:ml-8 xl:ml-16">
        {/* Home */}
        <div>
          <Link
            href="/"
            className={`font-medium transition px-3 py-1.5 rounded-full ${
              isActive("/")
                ? "bg-[#00D4AA] text-white"
                : "hover:text-accent-color"
            }`}
          >
            Home
          </Link>
        </div>
        <div>
          <Link
            href="/about"
            className={`font-medium transition px-3 py-1.5 rounded-full ${
              isActive("/about")
                ? "bg-[#00D4AA] text-white"
                : "hover:text-accent-color"
            }`}
          >
            About
          </Link>
        </div>

        {/* Services */}
        <div>
          <Link
            href="/services"
            className={`font-medium transition px-3 py-1.5 rounded-full ${
              isActive("/services")
                ? "bg-[#00D4AA] text-white"
                : "hover:text-accent-color"
            }`}
          >
            Services
          </Link>
        </div>

        {/* Features */}
        <div>
          <Link
            href="/features"
            className={`font-medium transition px-3 py-1.5 rounded-full ${
              isActive("/features")
                ? "bg-[#00D4AA] text-white"
                : "hover:text-accent-color"
            }`}
          >
            Features
          </Link>
        </div>

        {/* Contact */}
        <div>
          <Link
            href="/contact"
            className={`font-medium transition px-3 py-1.5 rounded-full ${
              isActive("/contact")
                ? "bg-[#00D4AA] text-white"
                : "hover:text-accent-color"
            }`}
          >
            Contact
          </Link>
        </div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-2 md:gap-3 lg:gap-3 xl:gap-5">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full hover:bg-card-bg transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          )}
        </button>

        {/* User Button */}
        {user ? (
          <div>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                ...getClerkConfig(theme).appearance,
                elements: { 
                  ...getClerkConfig(theme).appearance.elements,
                  avatarBox: "w-7 h-7 md:w-8 md:h-8" 
                }
              }}
            >
              <UserButton.MenuItems>
                {/* Profile Settings */}
                <UserButton.Action
                  label="Profile Settings"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 6.941-4.486A3.75 3.75 0 0 1 18 15.75v.231a2.25 2.25 0 0 1-2.25 2.25h-5.5A2.25 2.25 0 0 1 8.25 18v-.231a3.75 3.75 0 0 1 1.559-6.441A7.5 7.5 0 0 1 4.5 20.118Z"
                      />
                    </svg>
                  }
                  onClick={() => (window.location.href = "/profile")}
                />

                {/* Home */}
                <UserButton.Action
                  label="Home"
                  labelIcon={<HomeIcon />}
                  onClick={() => (window.location.href = "/")}
                />

                {/* About */}
                <UserButton.Action
                  label="About"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                      />
                    </svg>
                  }
                  onClick={() => (window.location.href = "/about")}
                />

                {/* Services */}
                <UserButton.Action
                  label="Services"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3H21"
                      />
                    </svg>
                  }
                  onClick={() => (window.location.href = "/services")}
                />

                {/* Features */}
                <UserButton.Action
                  label="Features"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                      />
                    </svg>
                  }
                  onClick={() => (window.location.href = "/features")}
                />

                {/* Contact */}
                <UserButton.Action
                  label="Contact"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  }
                  onClick={() => (window.location.href = "/contact")}
                />

                {/* Sign Out */}
                <UserButton.Action
                  label="Sign Out"
                  labelIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                      />
                    </svg>
                  }
                  onClick={handleLogout}
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        ) : (
          <button
            onClick={() => openSignIn()}
            className="bg-[#F8BD19] text-white px-4 py-1.5 rounded hover:bg-[#F8BD19]/90 transition"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Theme toggle button */}
      <div className="flex lg:hidden items-center gap-4">
        {/* Theme toggle button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center"
        >
          <Image
            className="w-5 h-5"
            src={assets.menu_icon}
            alt="menu"
            style={
              theme === "dark" ? { filter: "brightness(0) invert(1)" } : {}
            }
          />
        </button>
      </div>

      {/* Mobile/Tablet menu */}
        {isMenuOpen && (
        <div
            className="fixed right-0 top-0 h-full w-64 max-w-[80vw] p-5 z-[160] shadow-2xl lg:hidden"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
              borderLeft: `1px solid ${
                theme === "dark" ? "#334155" : "#e2e8f0"
              }`,
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2"></div>
              <div className="flex items-center gap-2">
                {/* Theme toggle for mobile */}
              <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full hover:bg-card-bg transition"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                      />
                    </svg>
                  )}
              </button>
              <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card-bg hover:text-red-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
              </button>
            </div>
            </div>

            <div className="flex flex-col">
              <Link
                href="/"
                className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                  isActive("/")
                    ? "bg-[#00D4AA] text-white"
                    : "bg-background hover:text-accent-color"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span
                  className={
                    isActive("/")
                      ? "text-white"
                      : theme === "dark"
                      ? "text-white"
                      : "text-gray-800"
                  }
                >
                  <HomeIcon />
                </span>
                <span
                  className={`text-base ${
                    isActive("/") ? "text-white" : "text-text-primary"
                  }`}
                >
                  Home
                </span>
              </Link>
              <Link
                href="/about"
                className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                  isActive("/about")
                    ? "bg-[#00D4AA] text-white"
                    : "bg-background hover:text-accent-color"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${
                    isActive("/about")
                      ? "text-white"
                      : theme === "dark"
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                  />
                </svg>
                <span
                  className={`text-base ${
                    isActive("/about") ? "text-white" : "text-text-primary"
                  }`}
                >
                  About
                </span>
              </Link>
              <Link
                href="/services"
                className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                  isActive("/services")
                    ? "bg-[#00D4AA] text-white"
                    : "bg-background hover:text-accent-color"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${
                    isActive("/services")
                      ? "text-white"
                      : theme === "dark"
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3H21"
                  />
                </svg>
                <span
                  className={`text-base ${
                    isActive("/services") ? "text-white" : "text-text-primary"
                  }`}
                >
                  Services
                </span>
              </Link>
              <Link
                href="/features"
                className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                  isActive("/features")
                    ? "bg-[#00D4AA] text-white"
                    : "bg-background hover:text-accent-color"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${
                    isActive("/features")
                      ? "text-white"
                      : theme === "dark"
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                  />
                </svg>
                <span
                  className={`text-base ${
                    isActive("/features") ? "text-white" : "text-text-primary"
                  }`}
                >
                  Features
                </span>
              </Link>
              <Link
                href="/contact"
                className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                  isActive("/contact")
                    ? "bg-[#00D4AA] text-white"
                    : "bg-background hover:text-accent-color"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${
                    isActive("/contact")
                      ? "text-white"
                      : theme === "dark"
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <span
                  className={`text-base ${
                    isActive("/contact") ? "text-white" : "text-text-primary"
                  }`}
                >
                  Contact
                </span>
              </Link>
              {!user && (
                <button
                  onClick={() => {
                    openSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 mt-4 bg-[#F8BD19] text-white px-4 py-2 rounded hover:bg-[#F8BD19]/90 transition w-full justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Sign In
                </button>
              )}
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="transition py-3 flex items-center gap-2 px-4 border-b border-border-color bg-background hover:text-accent-color"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 6.941-4.486A3.75 3.75 0 0 1 18 15.75v.231a2.25 2.25 0 0 1-2.25 2.25h-5.5A2.25 2.25 0 0 1 8.25 18v-.231a3.75 3.75 0 0 1 1.559-6.441A7.5 7.5 0 0 1 4.5 20.118Z"
                      />
                    </svg>
                    <span className="text-base text-text-primary">
                      Profile Settings
                    </span>
                  </Link>
                  <button
                    onClick={handleMobileLogout}
                    className="hover:text-red-600 transition py-3 border-b border-border-color text-left text-red-600 flex items-center gap-2 bg-background px-4"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-red-400" : "text-red-600"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                      />
                    </svg>
                    <span className="text-base">Sign Out</span>
                  </button>
                </>
              )}
            </div>
        </div>
        )}
    </nav>
  );
};

export default Navbar;
