'use client';

import React from 'react';
import CandidatesTable from '@/components/database/CandidatesTable';

export default function CandidatesPage() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Candidates Database</h1>
                    <p className="text-gray-500 mt-1">Manage and edit candidate records directly.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                <CandidatesTable />
            </div>
        </div>
    );
}
