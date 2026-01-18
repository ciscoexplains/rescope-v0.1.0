'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import {
    Loader2, Search, Trash2, Database, ArrowRight, CheckCircle2,
    Info, Play, ChevronDown, ChevronRight, User, Plus, X, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { MoveToCampaignModal } from '@/components/tools/MoveToCampaignModal';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { KOL_CATEGORIES } from '@/constants/categories';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';

interface InstagramProfile {
    id?: string;
    username: string;
    full_name: string;
    biography: string;
    followers: number;
    following: number;
    posts_count: number;
    is_verified: boolean;
    is_private: boolean;
    profile_pic_url: string;
    external_url: string;
    er: number;
    contact?: string;
    email?: string;
    tier?: string;
    median_views?: number;
    website?: string;
    avatar?: string;
    bio?: string;
    last_post_days?: number;
    category?: string;
}

export default function InstagramScraperPage() {
    // --- UI State ---
    const [loading, setLoading] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false); // Default closed

    // --- Discovery Settings ---
    const [startProfiles, setStartProfiles] = useState('');
    const [searchDepth, setSearchDepth] = useState('1');
    const [maxProfiles, setMaxProfiles] = useState(50);
    const [minFollowers, setMinFollowers] = useState<number | ''>('');
    const [maxFollowers, setMaxFollowers] = useState<number | ''>('');

    // --- Advanced Filtering ---
    const [accountType, setAccountType] = useState('any'); // Any, Business, Creator
    const [medianViews, setMedianViews] = useState<number | ''>('');
    const [mustBeVerified, setMustBeVerified] = useState(false);
    const [keywordString, setKeywordString] = useState(''); // Comma separated

    // --- Results & Move Logic ---
    const [results, setResults] = useState<InstagramProfile[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    useEffect(() => {
        loadExistingResults();
    }, []);

    const loadExistingResults = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('scraper_history_instagram')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const mapped = (data || []).map(item => ({
                ...item,
                profile_pic_url: item.avatar,
                external_url: item.website,
                biography: item.bio,
                last_post_days: item.last_post_days || 0
            }));
            if (mapped.length) {
                setResults(mapped);
                setShowResults(true);
            }
        } catch (error) { console.error(error); }
    };
    const updateField = async (index: number, field: string, value: any) => {
        // Optimistic update
        const newResults = [...results];
        newResults[index] = { ...newResults[index], [field]: value };
        setResults(newResults);

        // Update DB
        const item = newResults[index];
        if (item.id) {
            const { error } = await supabase
                .from('scraper_history_instagram')
                .update({ [field]: value })
                .eq('id', item.id);

            if (error) {
                console.error("Failed to update history", error);
                toast.error("Failed to save change");
            }
        }
    };

    // Scraping Handler
    const handleStart = async () => {
        if (!startProfiles.trim()) {
            toast.error('Please enter usernames');
            return;
        }

        setLoading(true);
        setShowResults(false);
        if (results.length > 0) setShowResults(true);

        const usernameList = startProfiles.split(',').map(u => u.trim()).filter(u => u);
        const keywordList = keywordString.split(',').map(k => k.trim()).filter(k => k);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You must be logged in to save results');
                setLoading(false);
                return;
            }

            const payload = {
                startProfiles: usernameList.join(','),
                usernames: usernameList,
                searchType: 'usernames',
                maxProfiles: maxProfiles,
                searchDepth: searchDepth,

                // Hidden Data Options (Defaults)
                extractEmail: true,
                extractPhone: true,
                extractWebsite: true,
                // Set 'false' defaults as requested
                extractCategory: false,
                extractAddress: false,
                extractCaptions: false,
                deepSearch: false,
                // Set 'true' default as requested
                calculateER: true,

                // Advanced Filtering
                keywords: keywordList,
                keywordLocation: 'anywhere', // Default hidden
                minFollowers: Number(minFollowers) || 0,
                maxFollowers: Number(maxFollowers) || 0,
                accountType,
                mustBeVerified,
                medianViews: Number(medianViews) || 0,

                // Defaults for unused/removed filters to safe values
                locationKeywords: '',
                profileLanguage: 'any',
                lastPostDays: 0,
                minPosts: 0,
                postsPeriod: '30',
                recentReels: 'disabled',
                viewsRatio: false,
                contactInfo: 'any',
                websitePresence: 'any',
                filterInfluencers: false,
                businessCategory: 'any'
            };

            const response = await fetch('/api/apify/instagram-scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed');

            if (data.results?.length) {
                const mappedForDB = data.results.map((p: any) => ({
                    user_id: user.id, // Add isolation
                    username: p.username || 'unknown',
                    full_name: p.full_name || '',
                    bio: p.bio || '',
                    followers: p.followers || 0,
                    following: p.following || 0,
                    posts_count: p.posts_count || 0,
                    is_verified: p.is_verified || false,
                    avatar: p.avatar || '',
                    website: p.external_url || p.website || '',
                    er: p.er || 0,
                    contact: p.contact || '',
                    email: p.email || '',
                    tier: p.tier || 'Nano',
                    median_views: p.median_views || 0,
                    avg_views: p.avg_views || p.median_views || 0,
                    avg_likes: p.avg_likes || 0,
                    avg_comments: p.avg_comments || 0,
                    quality_score: p.quality_score || 0,
                    business_category: p.business_category || '',
                    account_type: p.account_type || '',
                    is_private: p.is_private || false,
                    profile_language: p.profile_language || '',
                    last_post_days: p.last_post_days || 0
                }));
                // Update local state immediately
                setResults(prev => [...mappedForDB, ...prev]);
                setShowResults(true);

                // Save to Supabase
                const { error: saveError } = await supabase
                    .from('scraper_history_instagram')
                    .upsert(mappedForDB, { onConflict: 'username', ignoreDuplicates: true }); // Note: onConflict might need composite key (username, user_id) if supported by DB

                if (saveError) {
                    console.error("Error saving history:", saveError);
                    toast.error("Results shown but failed to save to history");
                } else {
                    toast.success("Results saved to history");
                }
            } else {
                toast.info('No profiles found.');
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Table Helper Functions
    const toggleSelectAll = () => {
        if (selectedIndices.size === results.length) setSelectedIndices(new Set());
        else setSelectedIndices(new Set(results.map((_, idx) => idx)));
    };
    const toggleSelect = (idx: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };
    const handleMoveSuccess = async () => {
        const selectedIds = Array.from(selectedIndices).map(idx => results[idx].id);
        await supabase.from('scraper_history_instagram').delete().in('id', selectedIds);
        setResults(prev => prev.filter((_, idx) => !selectedIndices.has(idx)));
        setSelectedIndices(new Set());
        toast.success('Moved successfully');
    };
    const getSelectedCandidates = () => {
        return Array.from(selectedIndices).map(idx => {
            const p = results[idx];
            return {
                kol_name: p.full_name || p.username,
                username: p.username,
                followers: p.followers,
                contact: p.contact || '',
                email: p.email || '',
                tier: p.tier || 'Nano',
                status: 'New',
                er: p.er,
                avatar: p.avatar || p.profile_pic_url,
                profile_url: `https://instagram.com/${p.username}`,
                is_verified: p.is_verified,
                total_likes: 0,
                total_videos: p.posts_count,
                avg_views: p.median_views,
                bio: p.biography || p.bio,
                following: p.following,
                posts_count: p.posts_count,
                median_views: p.median_views || 0,
                website: p.website || p.external_url,
                last_post_days: p.last_post_days || 0
            };
        });
    };
    const handleClearAll = async () => {
        await supabase.from('scraper_history_instagram').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        setResults([]);
        setSelectedIndices(new Set());
        toast.success('Cleared history');
    };

    return (
        <div className="container mx-auto p-4 lg:p-6 max-w-[1600px] space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Instagram Scraper</h1>
                <p className="text-muted-foreground">Detailed configuration for extracting Instagram profiles.</p>
                <Link href="/databases/instagram-history" className="text-sm text-blue-400 hover:underline flex items-center gap-1 w-fit">
                    View History <Database size={12} />
                </Link>
            </div>

            {/* Discovery Settings - Top */}
            <Card className="border-border bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-base">Discovery Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Key in Username */}
                    <div className="space-y-2">
                        <Label>Key in username(s)</Label>
                        <Textarea
                            value={startProfiles}
                            onChange={(e) => setStartProfiles(e.target.value)}
                            placeholder="@username1, @username2"
                            className="min-h-[80px] font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">Comma separated</p>
                    </div>

                    <div className="flex flex-wrap items-end gap-6">
                        {/* Maximum Profiles */}
                        <div className="space-y-2">
                            <Label>Maximum Profiles</Label>
                            <Input
                                type="number"
                                value={maxProfiles}
                                onChange={(e) => setMaxProfiles(parseInt(e.target.value) || 0)}
                                min={1}
                                className="w-[150px]"
                            />
                        </div>
                        {/* Followers Range */}
                        <div className="space-y-2">
                            <Label>Followers Range</Label>
                            <div className="flex items-center gap-2 w-[300px]">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={minFollowers}
                                    onChange={(e) => setMinFollowers(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-muted-foreground text-sm font-medium">—</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={maxFollowers}
                                    onChange={(e) => setMaxFollowers(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filtering Toggle */}
                    <div className="space-y-4 pt-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:text-primary transition-colors w-fit"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        >
                            {isAdvancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            Advanced filtering
                        </div>

                        {/* Advanced Fields */}
                        {isAdvancedOpen && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-border/50 animate-in slide-in-from-top-2 duration-200">
                                {/* Account Type */}
                                <div className="space-y-2">
                                    <Label>Account Type</Label>
                                    <Select value={accountType} onValueChange={setAccountType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any (Default)</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                            <SelectItem value="creator">Creator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Median Views */}
                                <div className="space-y-2">
                                    <Label>Median Views</Label>
                                    <Input
                                        type="number"
                                        value={medianViews}
                                        onChange={(e) => setMedianViews(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>

                                {/* Verified Accounts Only */}
                                <div className="flex items-center space-x-2 h-full pt-6">
                                    <Switch id="verified" checked={mustBeVerified} onCheckedChange={setMustBeVerified} />
                                    <Label htmlFor="verified" className="cursor-pointer">Verified Accounts Only</Label>
                                </div>

                                {/* Filter by Keywords */}
                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Filter by Keyword(s)</Label>
                                        <div className="group relative">
                                            <Info size={14} className="text-muted-foreground cursor-help" />
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-black/90 text-white text-xs p-2 rounded z-50 pointer-events-none">
                                                Key in the keyword and separate with comma (,) i.e Contoh Kata Kunci, Kata, Kata Kunci, etc
                                            </div>
                                        </div>
                                    </div>
                                    <Input
                                        value={keywordString}
                                        onChange={(e) => setKeywordString(e.target.value)}
                                        placeholder="Enter keywords..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Start Button */}
                    <div className="flex justify-end pt-4">
                        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20" onClick={handleStart} disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scraping...</> : <><Play className="mr-2 h-4 w-4" /> Start Scraping</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            {showResults && results.length > 0 && (
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-0">
                        <div>
                            <CardTitle>Instagram Results ({results.length})</CardTitle>
                            <CardDescription>Manage scraped profiles</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground hover:text-destructive hover:bg-white/5">
                                <Trash2 size={16} className="mr-2" /> Clear All
                            </Button>
                            {selectedIndices.size > 0 && (
                                <Button onClick={() => setIsMoveModalOpen(true)} className="gap-2 shadow-none">
                                    <ArrowRight size={16} /> Move to Campaign ({selectedIndices.size})
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="rounded-xl overflow-hidden overflow-x-auto bg-secondary/10">
                            <table className="w-full text-sm text-left text-foreground">
                                <thead className="text-xs text-muted-foreground uppercase bg-white/5 sticky top-0 whitespace-nowrap">
                                    <tr>
                                        <th className="px-4 py-3 w-[40px]"><Checkbox checked={results.length > 0 && selectedIndices.size === results.length} onCheckedChange={toggleSelectAll} className="border-white/10" /></th>
                                        <th className="px-4 py-3">Profile</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Followers</th>
                                        <th className="px-4 py-3">Following</th>
                                        <th className="px-4 py-3">Tier</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Median Views</th>
                                        <th className="px-4 py-3">ER</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {results.map((profile, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-4 align-top"><Checkbox checked={selectedIndices.has(idx)} onCheckedChange={() => toggleSelect(idx)} className="border-white/10" /></td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex items-start gap-3">
                                                    {profile.avatar && <img src={profile.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />}
                                                    <div>
                                                        <div className="font-medium flex items-center gap-1">{profile.full_name || profile.username} {profile.is_verified && <CheckCircle2 size={12} className="text-blue-500" />}</div>
                                                        <a href={profile.external_url || `https://instagram.com/${profile.username}`} target="_blank" className="text-xs text-blue-400 hover:underline">@{profile.username}</a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top text-xs space-y-1">
                                                {profile.email && <div>✉️ {profile.email}</div>}
                                                {profile.contact && <div className="flex items-center gap-1"><WhatsAppButton phone={profile.contact} className="mr-1" />📞 {profile.contact}</div>}
                                                {profile.website && <div className="truncate w-32">🌐 {profile.website}</div>}
                                            </td>
                                            <td className="px-4 py-4">{profile.followers?.toLocaleString()}</td>
                                            <td className="px-4 py-4 text-muted-foreground">{profile.following?.toLocaleString()}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                            ${profile.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                                        profile.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                            profile.tier === 'Mid/Macro' ? 'bg-purple-900/30 text-purple-400' :
                                                                'bg-yellow-900/30 text-yellow-400'}`}>
                                                    {profile.tier || 'Nano'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <select
                                                    className="w-full h-7 rounded-md border-none bg-white/5 px-2 text-xs focus:bg-secondary/50 appearance-none cursor-pointer text-foreground min-w-[140px]"
                                                    value={profile.category || ''}
                                                    onChange={(e) => updateField(idx, 'category', e.target.value)}
                                                >
                                                    <option value="" className="bg-zinc-900 text-muted-foreground">Select Category</option>
                                                    {KOL_CATEGORIES.map((category) => (
                                                        <option key={category} value={category} className="bg-zinc-900">
                                                            {category}
                                                        </option>
                                                    ))}
                                                    <option value="Other" className="bg-zinc-900">Other</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">{profile.median_views?.toLocaleString()}</td>
                                            <td className="px-4 py-4 font-medium text-green-400">{profile.er}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <MoveToCampaignModal
                open={isMoveModalOpen}
                onOpenChange={setIsMoveModalOpen}
                candidates={getSelectedCandidates()}
                platform="instagram"
                onSuccess={handleMoveSuccess}
            />
        </div>
    );
}
