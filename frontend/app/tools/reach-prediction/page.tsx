'use client';

import React, { useState } from 'react';
import { Search, Loader2, TrendingUp, Users, Eye, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PostData {
    id: string;
    createTime: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    desc: string;
}

interface ProfileData {
    username: string;
    nickname: string;
    followers: number;
    avgViews: number;
    er: number;
    verified: boolean;
}

export default function ReachPredictionPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ profile: ProfileData, posts: PostData[] } | null>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setData(null);

        try {
            const res = await fetch('/api/tools/reach-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: query })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to analyze');

            // Set data (posts are already in correct order from API, lets double check direction in chart)
            // API returns latest first. For chart we usually want Left=Oldest, Right=Newest
            setData({ ...result, posts: [...result.posts].reverse() });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
            <div className="flex-none">
                <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Post Reach Prediction</h1>
                <p className="text-gray-600 text-sm">Analyze the last 12 posts to predict future reach performance.</p>
            </div>

            <Card className="flex-none">
                <CardContent className="p-4">
                    <form onSubmit={handleAnalyze} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Input
                                label="TikTok Username"
                                placeholder="Enter username"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-32">
                            {loading ? <Loader2 className="animate-spin" /> : 'Analyze'}
                        </Button>
                    </form>
                    {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                </CardContent>
            </Card>

            {data && (
                <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Followers</p>
                                    <p className="text-xl font-bold">{formatNumber(data.profile.followers)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Avg. Engagement</p>
                                    <p className="text-xl font-bold">{data.profile.er}%</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Predicted Reach</p>
                                    <p className="text-xl font-bold">{formatNumber(data.profile.avgViews)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="flex-1 min-h-0 flex flex-col" noPadding>
                        <CardHeader className="py-3 px-4 flex-none">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp size={16} className="text-[var(--color-primary)]" />
                                Reach Trend & Prediction
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-4 pt-0">
                            <div className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.posts}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="createTime"
                                            tickFormatter={(_, i) => `${i + 1}`}
                                            tick={{ fontSize: 10 }}
                                        />
                                        <YAxis
                                            tickFormatter={formatNumber}
                                            tick={{ fontSize: 10 }}
                                            width={40}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [formatNumber(Number(value)), 'Views']}
                                            labelFormatter={(label, payload: any) => {
                                                if (payload && payload.length) {
                                                    return payload[0].payload.desc ? payload[0].payload.desc.substring(0, 50) + "..." : "Post";
                                                }
                                                return "";
                                            }}
                                        />
                                        <ReferenceLine y={data.profile.avgViews} label={{ value: 'Avg', fontSize: 10 }} stroke="red" strokeDasharray="3 3" />
                                        <Line
                                            type="monotone"
                                            dataKey="views"
                                            stroke="var(--color-primary)"
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: "var(--color-primary)" }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
