"use client";

import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX, FiUser, FiLogIn, FiLogOut, FiPlus } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import Button from './Button';

interface NavbarProps {
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    isAdmin: boolean;
    isVerifiedOrganizer?: boolean;
  } | null;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center"
            >
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">LocaList</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4 items-center">
            <Link 
              href="/events" 
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              Explore Events
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  href="/events/create" 
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Create Event
                </Link>
                
                {currentUser.isAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                
                <div className="relative ml-3">
                  <Link href="/profile">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      <FiUser className="h-4 w-4" />
                      <span>{currentUser.name || 'Profile'}</span>
                    </Button>
                  </Link>
                </div>
                
                <Link href="/api/auth/signout">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <FiLogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <FiLogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </Link>
                
                <Link href="/register">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <FiUser className="h-4 w-4" />
                    <span>Register</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              {isMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={cn('md:hidden', isMenuOpen ? 'block' : 'hidden')}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            href="/events"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={toggleMenu}
          >
            Explore Events
          </Link>
          
          {currentUser && (
            <Link
              href="/events/create"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={toggleMenu}
            >
              Create Event
            </Link>
          )}
          
          {currentUser?.isAdmin && (
            <Link
              href="/admin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={toggleMenu}
            >
              Admin
            </Link>
          )}
          
          {currentUser ? (
            <>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={toggleMenu}
              >
                Profile
              </Link>
              <Link
                href="/api/auth/signout"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={toggleMenu}
              >
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={toggleMenu}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 