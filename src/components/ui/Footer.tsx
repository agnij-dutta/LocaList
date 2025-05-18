import Link from 'next/link';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';
import Container from './Container';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <Container>
        <div className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">LocaList</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Discover and participate in local events happening in your community.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <FiInstagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <FiTwitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <FiFacebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Navigation
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Categories
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/events?category=garage_sale"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Garage Sales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events?category=sports"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Sports Matches
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events?category=class"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Community Classes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events?category=volunteer"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Volunteer Opportunities
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              &copy; {currentYear} LocaList. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
} 