'use client';

import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface IgAnalysisResult {
    username: string;
    fullName: string;
    biography: string;
    externalUrl: string;
    followers: number;
    following: number;
    posts: number;
    isVerified: boolean;
    isBusinessAccount: boolean;
    isProfessionalAccount: boolean;
    isPrivate: boolean;
    averageEngagementRate: number;
    fakeInfluencerScore: number;
    credibilityScore?: number;
    engagementScore: number;
    botScore: number;
    spamScore: number;
    isLikelyBot: boolean;
    profilePicUrl?: string;
}

export default function IgAnalyzerPage() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IgAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!username.trim()) {
            toast.warning('Please enter a username');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/apify/instagram-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze profile');
            }

            setResult(data.result);
            toast.success('Analysis complete!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Instagram Credibility Analysis</h1>
                <p className="text-gray-500 mt-2">Analyze Instagram profiles for authenticity and engagement metrics.</p>
            </div>

            {/* Search Input */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex gap-4 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter Instagram username (e.g. instagram)"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                        </div>
                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || !username.trim()}
                            className="bg-[var(--color-primary)] hover:opacity-90 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Profile'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
                    {/* Profile Overview */}
                    <Card className="col-span-1 shadow-sm border-gray-100 h-full">
                        <CardHeader>
                            <CardTitle>Profile Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 flex items-center justify-center text-3xl font-bold text-gray-400">
                                    {result.fullName ? result.fullName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <h2 className="text-xl font-bold">{result.fullName}</h2>
                                <h3 className="text-gray-500 text-sm mb-2">@{result.username}</h3>
                                {result.isVerified && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium mb-4">
                                        <CheckCircle size={12} className="mr-1" /> Verified Account
                                    </span>
                                )}
                                <p className="text-sm text-gray-600 mb-4">{result.biography}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-4">
                                <div>
                                    <div className="text-lg font-bold text-[var(--color-primary)]">{result.posts?.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Posts</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[var(--color-primary)]">{result.followers?.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Followers</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[var(--color-primary)]">{result.following?.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Following</div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Business Account</span>
                                    <span className={result.isBusinessAccount ? "text-green-600 font-medium" : "text-gray-600"}>
                                        {result.isBusinessAccount ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Professional Account</span>
                                    <span className={result.isProfessionalAccount ? "text-green-600 font-medium" : "text-gray-600"}>
                                        {result.isProfessionalAccount ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Private Account</span>
                                    <span className={result.isPrivate ? "text-red-600 font-medium" : "text-green-600"}>
                                        {result.isPrivate ? "Yes" : "No"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Analysis Scores */}
                    <div className="col-span-1 lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="shadow-sm border-gray-100">
                                <CardHeader>
                                    <CardTitle>Credibility Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Bot Check */}
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">Bot Likelihood</span>
                                            <span className={`text-sm font-bold ${result.isLikelyBot ? 'text-red-600' : 'text-green-600'}`}>
                                                {result.isLikelyBot ? 'High' : 'Low'}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${result.botScore > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${(result.botScore || 0) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Score: {result.botScore?.toFixed(2)}</p>
                                    </div>

                                    {/* Fake Influencer */}
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">Fake Influencer Score</span>
                                            <span className="text-sm font-bold text-gray-900">{(result.fakeInfluencerScore * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${result.fakeInfluencerScore > 0.5 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                                style={{ width: `${(result.fakeInfluencerScore || 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Spam Score */}
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">Spam Score</span>
                                            <span className="text-sm font-bold text-gray-900">{(result.spamScore * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${result.spamScore > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${(result.spamScore || 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-gray-100">
                                <CardHeader>
                                    <CardTitle>Performance Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Engagement Rate */}
                                    <div className="p-4 bg-[var(--color-primary)]/5 rounded-xl border border-[var(--color-primary)]/10 text-center">
                                        <div className="text-sm text-gray-500 mb-1">Avg. Engagement Rate</div>
                                        <div className="text-3xl font-bold text-[var(--color-primary)]">
                                            {(result.averageEngagementRate * 100).toFixed(2)}%
                                        </div>
                                    </div>

                                    {/* Engagement Score */}
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">Engagement Score</span>
                                            <span className="text-sm font-bold text-gray-900">{(result.engagementScore * 100).toFixed(1)}/100</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500"
                                                style={{ width: `${(result.engagementScore || 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
