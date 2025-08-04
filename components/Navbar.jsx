"use client";
import React, { useState, useEffect } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { isSeller, router, user, getCartCount, wishlist, handleLogout: contextLogout, products } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { openSignIn, signOut } = useClerk();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  
  const cartCount = getCartCount();
  const wishlistCount = wishlist?.length || 0;

  // Helper function to check if a link is active
  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/" || pathname === "";
    }
    if (path === "/all-products") {
      return pathname === "/all-products" || pathname.startsWith("/all-products?");
    }
    if (path === "/wishlist") {
      return pathname === "/wishlist";
    }
    if (path === "/cart") {
      return pathname === "/cart";
    }
    if (path === "/about") {
      return pathname === "/about";
    }
    if (path === "/contact") {
      return pathname === "/contact";
    }
    if (path === "/seller") {
      return pathname === "/seller" || pathname.startsWith("/seller/");
    }
    return pathname === path;
  };

  // Custom logout handler that also calls our AppContext's handleLogout
  const handleLogout = () => {
    contextLogout();
    toast.success('Logged out successfully');
  };
  
  // Mobile menu logout handler
  const handleMobileLogout = async () => {
    try {
      await signOut();
      contextLogout();
      toast.success('Logged out successfully');
      setIsMenuOpen(false);
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };
  
  // Icon wrapper component with dark mode support
  const IconWrapper = ({ src, alt, onClick, className }) => (
    <motion.div 
      className={`relative cursor-pointer ${onClick ? '' : ''}`} 
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <div className={`w-5 h-5 relative ${className || ''}`}>
        <Image 
          className="w-full h-full object-contain" 
          src={src} 
          alt={alt}
          style={theme === 'dark' ? { filter: 'brightness(0) invert(1)' } : {}}
        />
      </div>
    </motion.div>
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Filter products based on search query
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(filteredProducts.slice(0, 5)); // Limit to 5 results
  };

  // Handle mobile search input change
  const handleMobileSearchChange = (e) => {
    const query = e.target.value;
    setMobileSearchQuery(query);
  };

  // Handle mobile search form submission
  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      window.location.href = `/all-products?search=${encodeURIComponent(mobileSearchQuery)}`;
      setMobileSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/all-products?search=${encodeURIComponent(searchQuery)}`;
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  // Handle clicking on a search result
  const handleResultClick = (productId) => {
    window.location.href = `/product/${productId}`;
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('overflow-hidden');
      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const navVariants = {
    hidden: { y: -100 },
    visible: { 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const logoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const navContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };




  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-3 sm:px-6 md:px-8 lg:px-16 xl:px-32 py-3 md:py-4 border-b border-border-color text-text-primary transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/98 backdrop-blur-md shadow-xl' 
          : 'bg-background/95 backdrop-blur-sm shadow-lg'
      }`}
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >

      {/* Logo */}
      <motion.div 
        variants={logoVariants}
        className={`transition-transform duration-300 ${isScrolled ? 'scale-95' : 'scale-100'}`}
      >
      <Link href="/">
      <Image
        className="cursor-pointer w-24 sm:w-28 md:w-28 lg:w-32"
        src={isDarkMode ? assets.ezcart_logo_white : assets.ezcart_logo_dark}
        alt="EzCart"
        priority
      />
      </Link>
      </motion.div>
      

      {/* Desktop Menu */}
      <motion.div 
        className="hidden lg:flex items-center gap-2 md:gap-4 lg:gap-4 xl:gap-8 ml-8 md:ml-12 lg:ml-8 xl:ml-16"
        variants={navContainerVariants}
      >

        {/* Home */}
        <motion.div variants={navItemVariants}>
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
        </motion.div>

        {/* Shop */}
        <motion.div variants={navItemVariants}>
        <Link 
          href="/all-products" 
          className={`font-medium transition px-3 py-1.5 rounded-full ${
            isActive("/all-products") 
              ? "bg-[#00D4AA] text-white" 
              : "hover:text-accent-color"
          }`}
        >
          Shop
        </Link>
        </motion.div>

        {/* About */}
        <motion.div variants={navItemVariants}>
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
        </motion.div>

        {/* Contact */}
        <motion.div variants={navItemVariants}>
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
        </motion.div>

        {/* Merchant Portal */}
        {isSeller && (
          <motion.div variants={navItemVariants}>
            <Link 
              href="/seller" 
              className={`text-xs border border-border-color px-4 py-1.5 rounded-full transition block ${
                isActive("/seller") 
                  ? "bg-[#00D4AA] text-white border-[#00D4AA]" 
                  : "hover:bg-card-bg"
              }`}
          >
            Merchant Portal
            </Link>
          </motion.div>
        )}
      </motion.div>


   {/* Desktop Menu */}
      <motion.div 
        className="hidden lg:flex items-center gap-2 md:gap-3 lg:gap-3 xl:gap-5"
        variants={navContainerVariants}
      >

        {/* Search */}
        <motion.div 
          className="relative cursor-pointer" 
          onClick={(e) => {
          e.stopPropagation();
          setShowSearchResults(true);
          }}
          variants={navItemVariants}
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center min-w-0">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
              className="w-24 sm:w-32 md:w-40 lg:w-32 xl:w-48 border border-border-color rounded-l px-2 md:px-3 py-1.5 text-sm bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-orange-500 min-w-0 flex-shrink"
            />
            <motion.button 
              type="submit" 
              className="bg-background hover:bg-card-bg text-text-primary border border-l-0 border-border-color px-2 py-1.5 rounded-r"
              whileHover={{ backgroundColor: "var(--card-bg)" }}
              whileTap={{ scale: 0.95 }}
            >
              <IconWrapper src={assets.search_icon} alt="search icon" />
            </motion.button>
          </form>
          
          <AnimatePresence>
          {showSearchResults && searchResults.length > 0 && (
              <motion.div 
                className="absolute left-0 right-0 mt-1 bg-card-bg border border-border-color shadow-lg rounded-md p-2 z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {searchResults.map((product, index) => (
                  <motion.div 
                  key={product._id}
                  onClick={() => handleResultClick(product._id)}
                  className="p-2 hover:bg-background cursor-pointer rounded flex items-center gap-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "var(--background)" }}
                >
                  {product.image && (
                    <div className="w-8 h-8 relative">
                      <Image 
                        src={Array.isArray(product.image) ? product.image[0] : product.image} 
                        alt={product.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                    <p className="text-xs text-text-secondary">${product.offerPrice}</p>
                  </div>
                  </motion.div>
              ))}
                <motion.div 
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.location.href = `/all-products?search=${encodeURIComponent(searchQuery)}`;
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }
                }}
                className="p-2 text-center text-orange-500 hover:bg-background cursor-pointer rounded text-sm border-t border-border-color mt-1 pt-2"
                  whileHover={{ backgroundColor: "var(--background)" }}
              >
                See all results
                </motion.div>
              </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
        
        {/* Theme toggle button */}
        <motion.button 
          onClick={toggleTheme} 
          className="p-1.5 rounded-full hover:bg-card-bg transition"
          aria-label="Toggle theme"
          variants={navItemVariants}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </motion.button>
        

        {/* Wishlist */}
        <motion.div 
          className="relative cursor-pointer" 
          variants={navItemVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Link href="/wishlist">
          <IconWrapper src={assets.heart_icon} alt="wishlist icon" />
          <AnimatePresence>
          {wishlistCount > 0 && (
              <motion.div 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
              {wishlistCount}
              </motion.div>
            )}
          </AnimatePresence>
          </Link>
        </motion.div>
        
        {/* Cart */}
        <motion.div 
          className="relative cursor-pointer" 
          variants={navItemVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Link href="/cart">
          <IconWrapper src={assets.cart_icon} alt="cart icon" />
          <AnimatePresence>
          {cartCount > 0 && (
              <motion.div 
                className="absolute -top-2 -right-2 bg-[#F8BD19] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
              {cartCount}
              </motion.div>
          )}
          </AnimatePresence>
          </Link>
        </motion.div>


        {/* User Button */}
        {user ? (
          <motion.div variants={navItemVariants}>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7 md:w-8 md:h-8' } }}>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Home"
                  labelIcon={<HomeIcon />}
                  onClick={() => window.location.href = "/"}
                />
                <UserButton.Action
                  label="Products"
                  labelIcon={<BoxIcon />}
                  onClick={() => window.location.href = "/all-products"}
                />
                <UserButton.Action
                  label="Wishlist"
                  labelIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" 
                        stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  onClick={() => window.location.href = "/wishlist"}
                />
                <UserButton.Action
                  label="Cart"
                  labelIcon={<CartIcon />}
                  onClick={() => window.location.href = "/cart"}
                />
                <UserButton.Action
                  label="My Orders"
                  labelIcon={<BagIcon />}
                  onClick={() => window.location.href = "/my-orders"}
                />
                <UserButton.Action
                  label="Sign Out"
                  labelIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                  }
                  onClick={handleLogout}
                />
              </UserButton.MenuItems>
            </UserButton>
          </motion.div>
        ) : (
          <motion.button
            variants={navItemVariants}
            onClick={openSignIn}
            className="bg-[#F8BD19] text-white px-4 py-1.5 rounded hover:bg-[#F8BD19]/90 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.button>
        )}
      </motion.div>


      {/* Toggle menu button */}
      <div className="flex lg:hidden items-center gap-4">

        {/* Theme toggle button */}
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <Image
            className="w-5 h-5"
            src={assets.menu_icon}
            alt="menu"
            style={theme === 'dark' ? { filter: 'brightness(0) invert(1)' } : {}}
          />
        </motion.button>
      </div>


      {/* Mobile/Tablet menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div 
              className="absolute right-0 top-0 h-full w-64 max-w-[80vw] bg-background p-5 z-50 shadow-2xl"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--background)',
                borderLeft: '1px solid var(--border-color)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                </div>
                <div className="flex items-center gap-2">
                  {/* Theme toggle for mobile */}
                  <motion.button 
                    onClick={toggleTheme} 
                    className="p-1.5 rounded-full hover:bg-card-bg transition"
                    aria-label="Toggle theme"
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {theme === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                      </svg>
                    )}
                  </motion.button>

                  {/* Close menu button */}
                  <motion.button 
                    onClick={() => setIsMenuOpen(false)} 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card-bg hover:text-red-500 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              {/* Mobile search */}
              <div className="mb-6">
                <form onSubmit={handleMobileSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={mobileSearchQuery}
                    onChange={handleMobileSearchChange}
                    className="w-full border border-border-color rounded-l px-3 py-2 text-sm bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <motion.button 
                    type="submit" 
                    className="bg-background hover:bg-card-bg text-text-primary border border-l-0 border-border-color px-3 py-2 rounded-r flex items-center justify-center"
                    whileHover={{ backgroundColor: "var(--card-bg)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </motion.button>
                </form>
              </div>
              
              <div className="flex flex-col">
                {/* Home */}
                <Link 
                  href="/" 
                  className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                    isActive("/") 
                      ? "bg-[#00D4AA] text-white" 
                      : "bg-background hover:text-accent-color"
                  }`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className={isActive("/") ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-800')}>
                    <HomeIcon />
                  </span>
                  <span className={`text-base ${isActive("/") ? 'text-white' : 'text-text-primary'}`}>Home</span>
                </Link>

                {/* Shop */}
                <Link 
                  href="/all-products" 
                  className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                    isActive("/all-products") 
                      ? "bg-[#00D4AA] text-white" 
                      : "bg-background hover:text-accent-color"
                  }`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className={isActive("/all-products") ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-800')}>
                    <BoxIcon />
                  </span>
                  <span className={`text-base ${isActive("/all-products") ? 'text-white' : 'text-text-primary'}`}>Shop</span>
                </Link>

                {/* Wishlist */}
                <Link 
                  href="/wishlist" 
                  className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                    isActive("/wishlist") 
                      ? "bg-[#00D4AA] text-white" 
                      : "bg-background hover:text-accent-color"
                  }`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className={isActive("/wishlist") ? 'filter brightness-0 invert' : ''}>
                  <IconWrapper src={assets.heart_icon} alt="wishlist icon" />
                  </div>
                  <span className={`text-base ${isActive("/wishlist") ? 'text-white' : 'text-text-primary'}`}>Wishlist</span> 
                  {wishlistCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{wishlistCount}</span>}
                </Link>

                {/* Cart */}
                <Link 
                  href="/cart" 
                  className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                    isActive("/cart") 
                      ? "bg-[#00D4AA] text-white" 
                      : "bg-background hover:text-accent-color"
                  }`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className={isActive("/cart") ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-800')}>
                    <CartIcon />
                  </span>
                  <span className={`text-base ${isActive("/cart") ? 'text-white' : 'text-text-primary'}`}>Cart</span> 
                  {cartCount > 0 && <span className="ml-2 bg-[#F8BD19] text-white text-xs px-1.5 py-0.5 rounded-full">{cartCount}</span>}
                </Link>

                {/* About */}
                <Link 
                  href="/about" 
                  className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                    isActive("/about") 
                      ? "bg-[#00D4AA] text-white" 
                      : "bg-background hover:text-accent-color"
                  }`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${isActive("/about") ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-800')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                  <span className={`text-base ${isActive("/about") ? 'text-white' : 'text-text-primary'}`}>About</span>
                </Link>

                {/* Contact */}
                <Link 
                  href="/contact" 
                  className={`transition py-3 flex items-center gap-2 px-4 border-b border-border-color ${
                    isActive("/contact") 
                      ? "bg-[#00D4AA] text-white" 
                      : "bg-background hover:text-accent-color"
                  }`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${isActive("/contact") ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-800')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <span className={`text-base ${isActive("/contact") ? 'text-white' : 'text-text-primary'}`}>Contact</span>
                </Link>

                {/* Merchant Portal */}
                {isSeller && (
                  <Link
                    href="/seller"
                    onClick={() => setIsMenuOpen(false)}
                    className={`transition py-3 text-left flex items-center gap-2 px-4 border-b border-border-color ${
                      isActive("/seller") 
                        ? "bg-[#00D4AA] text-white" 
                        : "bg-background hover:text-accent-color"
                    }`}
                  >
                    <div className={isActive("/seller") ? 'filter brightness-0 invert' : ''}>
                    <IconWrapper src={assets.product_list_icon} alt="seller dashboard icon" />
                    </div>
                    <span className={`text-base ${isActive("/seller") ? 'text-white' : 'text-text-primary'}`}>Merchant Portal</span>
                  </Link>
                )}
                {!user && (
                  <button
                    onClick={() => {
                      openSignIn();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 mt-4 bg-[#F8BD19] text-white px-4 py-2 rounded hover:bg-[#F8BD19]/90 transition w-full justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign In
                  </button>
                )}
                {user && (
                  <button
                    onClick={handleMobileLogout}
                    className="hover:text-red-600 transition py-3 border-b border-border-color text-left text-red-600 flex items-center gap-2 bg-background px-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    <span className="text-base">Logout</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
