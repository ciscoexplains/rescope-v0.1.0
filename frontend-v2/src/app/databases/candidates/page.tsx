'use client';

import React, { useState } from 'react';
import TikTokCandidatesTable from '@/components/database/TikTokCandidatesTable';
import InstagramCandidatesTable from '@/components/database/InstagramCandidatesTable';

export default function CandidatesPage() {
    const [activeTab, setActiveTab] = useState<'tiktok' | 'instagram'>('tiktok');

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Candidates Database</h1>
            </div>

            <div className="flex space-x-1 rounded-lg bg-muted p-1 w-fit">
                <button
                    onClick={() => setActiveTab('tiktok')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                        ${activeTab === 'tiktok'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                >
                    TikTok Candidates
                </button>
                <button
                    onClick={() => setActiveTab('instagram')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                        ${activeTab === 'instagram'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                >
                    Instagram Candidates
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'tiktok' ? <TikTokCandidatesTable /> : <InstagramCandidatesTable />}
            </div>
        </div>
    );
}
