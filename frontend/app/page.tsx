'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, UserSearch, Filter, X, Check, BarChart2 } from 'lucide-react';

export default function Home() {
  const [description, setDescription] = useState('');
  const [scrapeLimit, setScrapeLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); // 'analyzing' | 'searching'
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState<number | ''>('');

  // Analysis State
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = async () => {
    if (!description.trim()) return;

    setLoading(true);
    setLoadingStep('analyzing');
    setError('');
    setResults([]);
    setSearched(false);
    setSelectedTiers([]);
    setMinFollowers('');
    setSelectedProfiles(new Set());

    try {
      // 1. Analyze and Recommend
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze campaign');
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No categories found');
      }

      // Take top 2 categories
      const categoriesToSearch = data.results.slice(0, 2);
      let combinedResults: any[] = [];

      setLoadingStep('searching');

      // 2. Sequential Search
      for (const cat of categoriesToSearch) {
        if (cat.queries && cat.queries.length > 0) {
          const query = cat.queries[0]; // Take the first query

          const searchRes = await fetch('/api/apify/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, limit: scrapeLimit }),
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const taggedResults = (searchData.results || []).map((item: any) => ({
              ...item,
              sourceCategory: cat.category, // Tag with category name
              sourceQuery: query
            }));
            combinedResults = [...combinedResults, ...taggedResults];
          }
        }
      }

      // Deduplicate results based on authorMeta.name
      const uniqueResults: any[] = [];
      const seenUsers = new Set<string>();

      for (const item of combinedResults) {
        const username = item.authorMeta?.name?.toLowerCase();
        if (username && !seenUsers.has(username)) {
          seenUsers.add(username);
          uniqueResults.push(item);
        }
      }

      setResults(uniqueResults);
      setSearched(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const removeProfile = (username: string) => {
    setResults(results.filter(item => item.authorMeta?.name !== username));
    if (selectedProfiles.has(username)) {
      const newSelection = new Set(selectedProfiles);
      newSelection.delete(username);
      setSelectedProfiles(newSelection);
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

  const toggleTier = (tier: string) => {
    if (selectedTiers.includes(tier)) {
      setSelectedTiers(selectedTiers.filter(t => t !== tier));
    } else {
      setSelectedTiers([...selectedTiers, tier]);
    }
  };

  const filteredResults = results.filter(item => {
    let matches = true;

    // Always exclude Untiered profiles (< 2000 followers)
    if (!getTier(item.authorMeta?.fans)) {
      return false;
    }

    // Tier Filter
    if (selectedTiers.length > 0) {
      const tier = getTier(item.authorMeta?.fans);
      if (!tier || !selectedTiers.includes(tier)) {
        matches = false;
      }
    }

    // Follower Filter
    if (minFollowers !== '' && (item.authorMeta?.fans || 0) < Number(minFollowers)) {
      matches = false;
    }

    return matches;
  });

  const tiers = ['Nano', 'Micro', 'Mid/Macro', 'Mega'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            RE:Scope by RENOIR
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered recommendations for your next influencer campaign.
          </p>
          {/* Removed Search Profiles Directly button as requested */}
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 max-w-3xl mx-auto w-full">
          <div className="space-y-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Campaign Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-lg p-4 bg-gray-50 resize-none outline-none ring-1 ring-gray-200"
              placeholder="e.g. We are launching a new line of extensive skincare products for teenagers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex items-center gap-4 py-2">
              <label htmlFor="limit" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Max Results (per category):
              </label>
              <input
                type="number"
                id="limit"
                min="1"
                max="100"
                value={scrapeLimit}
                onChange={(e) => setScrapeLimit(Number(e.target.value))}
                className="block w-24 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || !description}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                  {loadingStep === 'analyzing' ? 'Analyzing Campaign...' : 'Searching Candidates...'}
                </>
              ) : (
                'Find Matching KOLs'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto w-full rounded-xl bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {searched && (
          <div className="max-w-7xl mx-auto w-full">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  Filter Tiers:
                </span>
                {tiers.map(tier => (
                  <button
                    key={tier}
                    onClick={() => toggleTier(tier)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTiers.includes(tier)
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="minFollowers" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Min Followers:
                </label>
                <input
                  type="number"
                  id="minFollowers"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1000"
                  className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
                />
              </div>

              {(selectedTiers.length > 0 || minFollowers !== '') && (
                <button
                  onClick={() => { setSelectedTiers([]); setMinFollowers(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {filteredResults.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No matching profiles found.</p>
              </div>
            )}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResults.map((item, idx) => {
            const username = item.authorMeta?.name;
            const isSelected = selectedProfiles.has(username);

            return (
              <div
                key={idx}
                className={`bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all border flex flex-col relative group cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-gray-100'}`}
                onClick={() => toggleSelection(username)}
              >
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProfile(username);
                  }}
                  className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-20 shadow-sm border border-gray-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Remove Profile"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Selection Checkbox */}
                <div className={`absolute top-2 right-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors z-20 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-white/80 hover:border-indigo-500'}`}>
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </div>

                {/* Source Badge */}
                <div className="absolute top-0 left-12 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-b-lg font-medium z-10">
                  {item.sourceCategory}
                </div>

                <div className="p-6 flex-1 pt-8">
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
