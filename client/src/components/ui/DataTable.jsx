import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Responsive DataTable Component
 * CarrerSync Mint Design System compliant.
 */
export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'No records found matching criteria.',
  className = '',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
}) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-[#BACBC0]/40 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#BDF9F9]/35 border-b border-[#BACBC0]/40 text-xs font-semibold text-[#3B4A42] uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header || col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#BACBC0]/20 text-[#002020]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#5E7266]">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#02E8A7] border-t-transparent rounded-full animate-spin" />
                    <span>Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#5E7266] text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row[keyField] || rowIdx}
                  className="hover:bg-[#E2FFFE]/40 transition-colors duration-100"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.accessor || col.field]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#BACBC0]/30 px-4 py-3 bg-[#BDF9F9]/20 text-xs text-[#3B4A42]">
          <span>
            Page <span className="font-bold text-[#002020]">{currentPage}</span> of{' '}
            <span className="font-bold text-[#002020]">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-[#BACBC0]/50 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-[#BACBC0]/50 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
