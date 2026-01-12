'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Search, Save, CheckCircle } from 'lucide-react';
import TikTokCandidatesTable from '@/components/database/TikTokCandidatesTable';

export default function CampaignWorkspace() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        fetchCampaign();
        // Load persist results
        const savedRegex = localStorage.getItem(`campaign_${campaignId}_results`);
        if (savedRegex) {
            try {
                setSearchResults(JSON.parse(savedRegex));
            } catch (e) {
                console.error("Failed to load saved results", e);
            }
        }
    }, [campaignId]);

    useEffect(() => {
        // Save results whenever they change, but only if not empty
        // This prevents wiping the storage on initial mount
        if (searchResults.length > 0) {
            localStorage.setItem(`campaign_${campaignId}_results`, JSON.stringify(searchResults));
        }
    }, [searchResults, campaignId]);

    const fetchCampaign = async () => {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();
        if (error) {
            toast.error('Failed to load campaign');
            router.push('/workdesk');
            return;
        }
        setCampaign(data);
    };

    const calculateTier = (followers: number) => {
        if (followers > 1000000) return 'Mega';
        if (followers >= 100000) return 'Mid/Macro';
        if (followers >= 10000) return 'Micro';
        if (followers >= 2000) return 'Nano';
        return 'Nano';
    };

    const handleSearch = async () => {
        if (!query) return toast.error('Enter a search query');
        setLoading(true);
        // Don't clear results, we want to append
        // setSearchResults([]);

        try {
            const res = await fetch('/api/apify/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, limit }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');

            // Process results with tier calculation
            const processedResults = (data.results || []).map((item: any) => ({
                ...item,
                tier: calculateTier(item.authorMeta?.fans || 0)
            }));

            setSearchResults(prev => {
                const combined = [...prev, ...processedResults];
                const unique = combined.filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t.authorMeta?.name === item.authorMeta?.name
                    ))
                );
                return unique;
            });
            toast.success(`Found ${processedResults.length} profiles. Review and submit.`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (searchResults.length === 0) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const candidates = searchResults.map((item: any) => ({
                campaign_id: campaignId,
                username: item.authorMeta?.name || 'unknown',
                kol_name: item.authorMeta?.nickName || item.authorMeta?.name || 'Unknown',
                tt_followers: item.authorMeta?.fans || 0,
                avg_views: item.playCount || 0,
                status: 'New',
                tier: item.tier || calculateTier(item.authorMeta?.fans || 0),
                tiktok: item.authorMeta?.name || '',
                avatar: item.authorMeta?.avatar || '',
            }));

            const { error } = await supabase
                .from('candidates_tiktok')
                .insert(candidates);

            if (error) throw error;
            toast.success(`Saved ${candidates.length} candidates to Reviewed tab`);
            setSearchResults([]); // Clear list
            localStorage.removeItem(`campaign_${campaignId}_results`); // Clear persistence
            setActiveTab('reviewed'); // Switch tab

        } catch (error: any) {
            console.error('Save error details:', JSON.stringify(error, null, 2));
            toast.error('Failed to save to database');
        } finally {
            setSaving(false);
        }
    };

    const handleFinish = async () => {
        const { error } = await supabase
            .from('campaigns')
            .update({ status: 'Completed' })
            .eq('id', campaignId);

        if (error) toast.error('Failed to finish campaign');
        else {
            toast.success('Campaign marked as completed');
            router.push('/workdesk');
        }
    };

    if (!campaign) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title={`Workdesk: ${campaign.brand_name}`}>
                <Button variant="outline" onClick={handleFinish} className="gap-2">
                    <CheckCircle size={16} />
                    Finish Task
                </Button>
            </DashboardHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">Active Task (Scraper)</TabsTrigger>
                    <TabsTrigger value="reviewed">Reviewed Candidates</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card shadow-sm">
                        <div className="font-semibold text-sm whitespace-nowrap pl-2">TikTok Scraper</div>

                        <div className="h-6 w-[1px] bg-border" />

                        <input
                            placeholder="Search Query (e.g. skin care)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <input
                            type="number"
                            placeholder="Limit"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            min={1}
                            max={50}
                            className="flex h-9 w-[80px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <Button onClick={handleSearch} disabled={loading || saving} className="h-9 px-6 shadow-none">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                            {loading ? 'Scraping' : 'Search'}
                        </Button>
                    </div>

                    {/* Expanded Results Table */}
                    {searchResults.length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Scraped Results ({searchResults.length})</CardTitle>
                                    <CardDescription>Review candidates before saving to the database.</CardDescription>
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    <Save size={16} />
                                    Submit to Reviewed
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground whitespace-nowrap">
                                            <tr>
                                                <th className="px-4 py-3">Profile</th>
                                                <th className="px-4 py-3">Bio</th>
                                                <th className="px-4 py-3">Followers</th>
                                                <th className="px-4 py-3">Total Likes</th>
                                                <th className="px-4 py-3">Videos</th>
                                                <th className="px-4 py-3">Avg Views</th>
                                                <th className="px-4 py-3">Tier</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {searchResults.map((item: any, idx) => (
                                                <tr key={idx} className="bg-card hover:bg-muted/50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {item.authorMeta?.avatar && (
                                                                <img src={item.authorMeta.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            )}
                                                            <div>
                                                                <div className="font-medium">{item.authorMeta?.nickName || item.authorMeta?.name}</div>
                                                                <div className="text-xs text-muted-foreground">@{item.authorMeta?.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 min-w-[200px] max-w-[300px] truncate" title={item.authorMeta?.signature}>
                                                        {item.authorMeta?.signature || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{item.authorMeta?.fans?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{item.authorMeta?.heart?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{item.authorMeta?.video?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{item.playCount?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                            ${item.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                                                item.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                                    item.tier === 'Mid/Macro' ? 'bg-purple-900/30 text-purple-400' :
                                                                        'bg-yellow-900/30 text-yellow-400'}`}>
                                                            {item.tier}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="reviewed">
                    <div className="border rounded-md">
                        <TikTokCandidatesTable campaignId={campaignId} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
