'use client';

import React, { useState } from 'react';
import { Database, Search, Users } from 'lucide-react';
import CandidatesTable from '@/components/database/CandidatesTable';
import SearchTrendsTable from '@/components/database/SearchTrendsTable';

export default function DatabasesPage() {
    const [activeTab, setActiveTab] = useState<'candidates' | 'trends'>('candidates');

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Databases</h1>
                    <p className="text-gray-500 mt-1">Manage and edit raw data directly.</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveTab('candidates')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'candidates'
                                ? 'bg-white shadow-sm text-[var(--color-primary)]'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Users size={16} />
                        Candidates
                    </button>
                    <button
                        onClick={() => setActiveTab('trends')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'trends'
                                ? 'bg-white shadow-sm text-[var(--color-primary)]'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Search size={16} />
                        Search Trends
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                {activeTab === 'candidates' ? (
                    <CandidatesTable />
                ) : (
                    <SearchTrendsTable />
                )}
            </div>
        </div>
    );
}
