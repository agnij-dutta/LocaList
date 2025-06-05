"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalItems, itemsPerPage, baseUrl }: PaginationProps) {
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <Link
          key={1}
          href={buildUrl(1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md leading-5 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
        >
          1
        </Link>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-3 py-2 text-sm font-medium text-gray-500">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Link
          key={i}
          href={buildUrl(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md leading-5 ${
            i === currentPage
              ? 'text-white bg-primary border border-primary'
              : 'text-gray-500 bg-white border border-gray-300 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200'
          }`}
        >
          {i}
        </Link>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-3 py-2 text-sm font-medium text-gray-500">
            ...
          </span>
        );
      }
      
      pages.push(
        <Link
          key={totalPages}
          href={buildUrl(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md leading-5 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
        >
          {totalPages}
        </Link>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-8">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
      </div>
      
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md leading-5 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
          >
            <FiChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Link>
        ) : (
          <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-md leading-5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600">
            <FiChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </span>
        )}

        {/* Page numbers */}
        <div className="flex space-x-1">
          {renderPageNumbers()}
        </div>

        {/* Next button */}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md leading-5 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
          >
            Next
            <FiChevronRight className="w-4 h-4 ml-1" />
          </Link>
        ) : (
          <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-md leading-5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600">
            Next
            <FiChevronRight className="w-4 h-4 ml-1" />
          </span>
        )}
      </div>
    </div>
  );
} 