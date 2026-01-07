'use client';

import React from 'react';
import SearchTrendsTable from '@/components/database/SearchTrendsTable';

export default function SearchTrendsPage() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Search Trends Database</h1>
                    <p className="text-gray-500 mt-1">Manage and edit search trends directly.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                <SearchTrendsTable />
            </div>
        </div>
    );
}
