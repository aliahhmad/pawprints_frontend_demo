'use client';

import React, { useState } from 'react';
import './navbar.css';
import Link from '@/old/link';
import LoginButton from './LoginButton';
import logo from '../assets/pawprintslogowhite-03.svg';
import 'material-symbols';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();

  function toggleDropdown() {
    setIsDropdownOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  function toggleMobileMenu() {
    setIsMobileMenuOpen((prev) => !prev);
  }

  return (
    <div className="navbar">

      {/* LEFT - Hamburger (mobile only) */}
      <div className="nav-left-mobile">
        <button className="hamburger" onClick={toggleMobileMenu}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* LEFT - Desktop links */}
      <div className="nav-left-desktop">
        <Link href="/old">
          <div className="logo">
            <img src={logo.src} alt="PawPrints Logo" />
          </div>
        </Link>

        <Link href="/old/create"><p>Create</p></Link>
        <Link href="/old"><p>Browse</p></Link>

        <div
          className="dropdown"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={closeDropdown}
        >
          <div className="dropdown-trigger">
            <p>More</p>
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <Link href="/old/about"><p>About</p></Link>
              <Link href="/old/committees"><p>Committees</p></Link>
              <Link href="https://www.rit.edu/studentgovernment/"><p>SG Website</p></Link>
            </div>
          )}
        </div>
      </div>

      {/* CENTER - Logo (mobile only) */}
      <div className="nav-center-mobile">
        <Link href="/old">
          <div className="logo">
            <img src={logo.src} alt="PawPrints Logo" />
          </div>
        </Link>
      </div>

      {/* RIGHT - Login (always visible) */}
      <div className="nav-right">
        <LoginButton />
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <Link href="/old/create">Create</Link>
          <Link href="/old">Browse</Link>
          <Link href="/old/about">About</Link>
          <Link href="/old/committees">Committees</Link>
          <Link href="https://www.rit.edu/studentgovernment/">SG Website</Link>
        </div>
      )}
    </div>
  );
}
