'use client';

import { useState } from 'react';
import { Search, Loader2, Check, X, BarChart2 } from 'lucide-react';

export default function SearchProfiles() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    // Analysis State
    const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResults([]);
        setSearched(true);
        setSelectedProfiles(new Set()); // Reset selection on new search

        try {
            const res = await fetch('/api/apify/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch results');
            }

            const rawResults = data.results || [];

            // Deduplicate results
            const uniqueResults: any[] = [];
            const seenUsers = new Set<string>();

            for (const item of rawResults) {
                const username = item.authorMeta?.name?.toLowerCase();
                if (username && !seenUsers.has(username)) {
                    seenUsers.add(username);
                    uniqueResults.push(item);
                }
            }

            setResults(uniqueResults);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (username: string) => {
        const newSelection = new Set(selectedProfiles);
        if (newSelection.has(username)) {
            newSelection.delete(username);
        } else {
            newSelection.add(username);
        }
        setSelectedProfiles(newSelection);
    };

    const removeProfile = (username: string) => {
        setResults(results.filter(item => item.authorMeta?.name !== username));
        if (selectedProfiles.has(username)) {
            const newSelection = new Set(selectedProfiles);
            newSelection.delete(username);
            setSelectedProfiles(newSelection);
        }
    };

    const handleAnalyze = async () => {
        if (selectedProfiles.size === 0) return;

        setAnalyzing(true);
        setError('');

        try {
            const res = await fetch('/api/apify/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profiles: Array.from(selectedProfiles) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to analyze profiles');
            }

            setAnalysisResults(data.results || []);
            setShowModal(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-7xl mx-auto space-y-8 pb-24">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        TikTok Profile Search
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Search for TikTok profiles using keywords via Apify
                    </p>
                </div>

                {/* Search Form */}
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSearch} className="relative flex gap-2">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl leading-5 bg-white shadow-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg"
                                placeholder="Enter keywords (e.g. hijab)..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="inline-flex items-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Search'}
                        </button>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-2xl mx-auto rounded-xl bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((item, idx) => {
                        const username = item.authorMeta?.name;
                        const isSelected = selectedProfiles.has(username);

                        return (
                            <div
                                key={idx}
                                className={`bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all border flex flex-col cursor-pointer relative ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-gray-100'}`}
                                onClick={() => toggleSelection(username)}
                            >
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeProfile(username);
                                    }}
                                    className="absolute top-4 left-4 p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-20 shadow-sm border border-gray-200"
                                    title="Remove Profile"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Selection Checkbox */}
                                <div className={`absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors z-20 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-white/80 hover:border-indigo-500'}`}>
                                    {isSelected && <Check className="h-4 w-4 text-white" />}
                                </div>

                                <div className="p-6 flex-1">
                                    <div className="flex items-center space-x-4 mb-4">
                                        {item.authorMeta?.avatar && (
                                            <img
                                                src={item.authorMeta.avatar}
                                                alt={item.authorMeta.name}
                                                className="h-12 w-12 rounded-full object-cover border border-gray-200"
                                            />
                                        )}
                                        <div className="overflow-hidden">
                                            <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                                                {item.authorMeta?.nickName || item.authorMeta?.name || 'Unknown User'}
                                                {getTier(item.authorMeta?.fans) && (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTierColor(getTier(item.authorMeta?.fans))}`}>
                                                        {getTier(item.authorMeta?.fans)}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">
                                                @{item.authorMeta?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {item.authorMeta?.signature || 'No bio available'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                        <div className="bg-gray-100 px-2 py-1 rounded flex justify-between">
                                            <span>Followers:</span>
                                            <span className="font-semibold text-gray-700">{statsFormatter(item.authorMeta?.fans)}</span>
                                        </div>
                                        <div className="bg-gray-100 px-2 py-1 rounded flex justify-between">
                                            <span>Following:</span>
                                            <span className="font-semibold text-gray-700">{statsFormatter(item.authorMeta?.following)}</span>
                                        </div>
                                        <div className="bg-gray-100 px-2 py-1 rounded flex justify-between">
                                            <span>Likes:</span>
                                            <span className="font-semibold text-gray-700">{statsFormatter(item.authorMeta?.heart)}</span>
                                        </div>
                                        <div className="bg-gray-100 px-2 py-1 rounded flex justify-between">
                                            <span>Videos:</span>
                                            <span className="font-semibold text-gray-700">{statsFormatter(item.authorMeta?.video)}</span>
                                        </div>
                                        {item.authorMeta?.digg !== undefined && (
                                            <div className="bg-gray-100 px-2 py-1 rounded flex justify-between col-span-2">
                                                <span>Digg:</span>
                                                <span className="font-semibold text-gray-700">{statsFormatter(item.authorMeta?.digg)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    <a
                                        href={`https://www.tiktok.com/@${item.authorMeta?.name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center justify-center"
                                    >
                                        View on TikTok
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Floating Analysis Button */}
                {selectedProfiles.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-gray-800 transition-all transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {analyzing ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <BarChart2 className="h-5 w-5" />
                            )}
                            <span className="font-semibold text-lg">
                                {analyzing ? 'Analyzing...' : `Analyze ${selectedProfiles.size} Profile${selectedProfiles.size > 1 ? 's' : ''}`}
                            </span>
                        </button>
                    </div>
                )}

                {!loading && searched && results.length === 0 && !error && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No profiles found for "{query}"</p>
                    </div>
                )}
            </div>

            {/* Analysis Results Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setShowModal(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start w-full">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-6" id="modal-title">
                                        Analysis Results
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Videos Scraped</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Views</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Views</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Interactions</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ER (View-based)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {analysisResults.map((profile, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {profile.avatar && (
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <img className="h-10 w-10 rounded-full" src={profile.avatar} alt="" />
                                                                    </div>
                                                                )}
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{profile.nickname || profile.username}</div>
                                                                    <div className="text-sm text-gray-500">@{profile.username}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {profile.totalVideos}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {statsFormatter(profile.totalViews)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {statsFormatter(Math.round(profile.avgViews))}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {statsFormatter(profile.totalInteractions)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {profile.erByViews}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function statsFormatter(num: number | undefined) {
    if (num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function getTier(followers: number | undefined) {
    if (followers === undefined) return null;
    if (followers >= 1000000) return 'Mega';
    if (followers >= 100000) return 'Mid/Macro';
    if (followers >= 10000) return 'Micro';
    if (followers >= 2000) return 'Nano';
    return null;
}

function getTierColor(tier: string | null) {
    switch (tier) {
        case 'Mega': return 'bg-purple-100 text-purple-800';
        case 'Mid/Macro': return 'bg-blue-100 text-blue-800';
        case 'Micro': return 'bg-green-100 text-green-800';
        case 'Nano': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
