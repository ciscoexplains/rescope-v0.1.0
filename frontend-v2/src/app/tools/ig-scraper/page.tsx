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
}

export default function InstagramScraperPage() {
    // --- UI State ---
    // --- UI State ---
    const [loading, setLoading] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

    // --- Section 1: Discovery Settings ---
    const [startProfiles, setStartProfiles] = useState(''); // Text input
    const [searchDepth, setSearchDepth] = useState('1'); // Dropdown
    const [maxProfiles, setMaxProfiles] = useState(50); // Number input

    // --- Section 2: Data Extraction Options ---
    const [extractEmail, setExtractEmail] = useState(true);
    const [extractPhone, setExtractPhone] = useState(true);
    const [extractWebsite, setExtractWebsite] = useState(true);
    const [extractCategory, setExtractCategory] = useState(false);
    const [extractAddress, setExtractAddress] = useState(false); // Physical Address
    const [calculateER, setCalculateER] = useState(true);
    const [extractCaptions, setExtractCaptions] = useState(false);
    const [deepSearch, setDeepSearch] = useState(false);

    // --- Section 3: Advanced Filtering ---
    // Keywords
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [bulkKeywords, setBulkKeywords] = useState('');
    const [keywordLocation, setKeywordLocation] = useState('anywhere'); // Dropdown: Biography, Full Name

    const [locationKeywords, setLocationKeywords] = useState('');
    const [profileLanguage, setProfileLanguage] = useState('any');

    const [minFollowers, setMinFollowers] = useState<number | ''>('');
    const [maxFollowers, setMaxFollowers] = useState<number | ''>('');

    const [lastPostDays, setLastPostDays] = useState<number | ''>('');

    const [minPosts, setMinPosts] = useState<number | ''>('');
    const [postsPeriod, setPostsPeriod] = useState('30'); // Dropdown: In the last X days

    const [recentReels, setRecentReels] = useState('disabled');
    const [medianViews, setMedianViews] = useState<number | ''>('');
    const [viewsRatio, setViewsRatio] = useState(false); // Ratio >= 30%

    const [contactInfo, setContactInfo] = useState('any');
    const [websitePresence, setWebsitePresence] = useState('any');
    const [accountType, setAccountType] = useState('any');
    const [filterInfluencers, setFilterInfluencers] = useState(false);
    const [businessCategory, setBusinessCategory] = useState('any');
    const [mustBeVerified, setMustBeVerified] = useState(false);

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
            const { data, error } = await supabase
                .from('scraper_history_instagram')
                .select('*')
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

    // Keyword Logic
    const addKeyword = () => {
        if (newKeyword.trim()) {
            setKeywords([...keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };
    const removeKeyword = (idx: number) => {
        setKeywords(keywords.filter((_, i) => i !== idx));
    };
    const openBulkEdit = () => {
        setBulkKeywords(keywords.join('\n'));
        setIsBulkEditOpen(true);
    };
    const saveBulkKeywords = () => {
        setKeywords(bulkKeywords.split('\n').map(k => k.trim()).filter(k => k));
        setIsBulkEditOpen(false);
    };

    // Scraping Handler
    const handleStart = async () => {
        if (!startProfiles.trim()) {
            toast.error('Please enter Start Profiles');
            return;
        }

        setLoading(true);
        setShowResults(false);
        if (results.length > 0) setShowResults(true);

        const usernameList = startProfiles.split(',').map(u => u.trim()).filter(u => u);

        try {
            const payload = {
                startProfiles: usernameList.join(','),
                usernames: usernameList,
                searchType: 'usernames',
                maxProfiles: maxProfiles, // Match backend expectation
                searchDepth: searchDepth,

                extractEmail, extractPhone, extractWebsite, extractCategory,
                extractAddress, calculateER, extractCaptions, deepSearch,

                keywords, keywordLocation,
                locationKeywords, profileLanguage,
                minFollowers: Number(minFollowers) || 0,
                maxFollowers: Number(maxFollowers) || 0,
                lastPostDays: Number(lastPostDays) || 0,
                minPosts: Number(minPosts) || 0,
                postsPeriod,
                recentReels,
                medianViews: Number(medianViews) || 0,
                viewsRatio,
                contactInfo,
                websitePresence,
                accountType,
                filterInfluencers,
                businessCategory,
                mustBeVerified
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
                    username: p.username || 'unknown',
                    full_name: p.full_name || '',
                    bio: p.bio || '', // API sends bio
                    followers: p.followers || 0,
                    following: p.following || 0,
                    posts_count: p.posts_count || 0,
                    is_verified: p.is_verified || false,
                    avatar: p.avatar || '', // API sends avatar
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
                // Update local state immediately so user sees results
                setResults(prev => [...mappedForDB, ...prev]);
                setShowResults(true);

                // Save to Supabase (Upsert to handle duplicates if any)
                const { error: saveError } = await supabase
                    .from('scraper_history_instagram')
                    .upsert(mappedForDB, { onConflict: 'username', ignoreDuplicates: true });

                if (saveError) {
                    console.error("Error saving history:", saveError);
                    toast.error("Results shown but failed to save to history: " + saveError.message);
                } else {
                    toast.success("Results saved to history");
                }
            } else {
                toast.info('No profiles found. Try separate usernames with commas.');
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

            <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Configuration Column */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Section 1: Discovery Settings */}
                    <Card className="border-border bg-card/50 backdrop-blur">
                        <CardHeader><CardTitle className="text-base">Discovery Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Start Profiles</Label>
                                <Textarea
                                    value={startProfiles}
                                    onChange={(e) => setStartProfiles(e.target.value)}
                                    placeholder="@username1, @username2"
                                    className="min-h-[100px] font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">Comma separated</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Depth</Label>
                                    <Select value={searchDepth} onValueChange={setSearchDepth}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Profiles</Label>
                                    <Input
                                        type="number"
                                        value={maxProfiles}
                                        onChange={(e) => setMaxProfiles(parseInt(e.target.value) || 0)}
                                        min={1}
                                    />
                                </div>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20" onClick={handleStart} disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scraping...</> : <><Play className="mr-2 h-4 w-4" /> Start Scraping</>}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Section 2: Data Extraction Options */}
                    <Card className="border-border bg-card/50 backdrop-blur">
                        <CardHeader><CardTitle className="text-base">Data Options</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <DataOption label="Extract Email" checked={extractEmail} onChange={setExtractEmail} />
                            <DataOption label="Extract Phone" checked={extractPhone} onChange={setExtractPhone} />
                            <DataOption label="Extract Website" checked={extractWebsite} onChange={setExtractWebsite} />
                            <DataOption label="Business Category" checked={extractCategory} onChange={setExtractCategory} />
                            <DataOption label="Physical Address" checked={extractAddress} onChange={setExtractAddress} />
                            <DataOption label="Calculate ER" checked={calculateER} onChange={setCalculateER} />
                            <DataOption label="Latest Captions" checked={extractCaptions} onChange={setExtractCaptions} />
                            <DataOption label="Deep Search" checked={deepSearch} onChange={setDeepSearch} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Advanced & Results */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Section 3: Advanced Filtering */}
                    <Card className="border-border bg-card/50 backdrop-blur">
                        <div
                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base">Advanced Filtering</CardTitle>
                                {!isAdvancedOpen && <span className="text-xs text-muted-foreground ml-2">(Click to expand)</span>}
                            </div>
                            {isAdvancedOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>

                        {isAdvancedOpen && (
                            <CardContent className="space-y-6 pt-0 border-t border-border/50 p-6">
                                {/* Keywords */}
                                <div className="space-y-3 bg-secondary/10 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <Label>Filter by Keywords</Label>
                                        <Button variant="outline" size="sm" onClick={openBulkEdit} className="h-6 gap-1 text-xs px-2"><Edit size={12} /> Bulk edit</Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            placeholder="Add keyword..."
                                            className="h-8 max-w-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                                        />
                                        <Button size="sm" onClick={addKeyword} variant="secondary" className="h-8">+ Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map((k, i) => (
                                            <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs flex items-center gap-1 group">
                                                {k}
                                                <X size={12} className="cursor-pointer opacity-50 group-hover:opacity-100" onClick={() => removeKeyword(i)} />
                                            </span>
                                        ))}
                                        {keywords.length === 0 && <span className="text-xs text-muted-foreground italic">No keywords added</span>}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs">Search Keywords In</Label>
                                        <Select value={keywordLocation} onValueChange={setKeywordLocation}>
                                            <SelectTrigger className="h-8 w-[200px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="anywhere">Anywhere</SelectItem>
                                                <SelectItem value="biography">Biography</SelectItem>
                                                <SelectItem value="full_name">Full Name</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Location Keywords</Label>
                                        <Input value={locationKeywords} onChange={(e) => setLocationKeywords(e.target.value)} placeholder="e.g. Jakarta" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Profile Language</Label>
                                        <Select value={profileLanguage} onValueChange={setProfileLanguage}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any</SelectItem>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="id">Indonesian</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Label>Follower Count Range</Label>
                                        <div className="flex gap-3">
                                            <Input type="number" placeholder="Min" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value === '' ? '' : parseInt(e.target.value))} />
                                            <Input type="number" placeholder="Max" value={maxFollowers} onChange={(e) => setMaxFollowers(e.target.value === '' ? '' : parseInt(e.target.value))} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Last Post Date (Days ago)</Label>
                                        <Input type="number" value={lastPostDays} onChange={(e) => setLastPostDays(e.target.value === '' ? '' : parseInt(e.target.value))} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Posting Frequency (Min Posts)</Label>
                                        <div className="flex gap-2">
                                            <Input type="number" value={minPosts} onChange={(e) => setMinPosts(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Min" />
                                            <Select value={postsPeriod} onValueChange={setPostsPeriod}>
                                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="7">Last 7 days</SelectItem>
                                                    <SelectItem value="30">Last 30 days</SelectItem>
                                                    <SelectItem value="90">Last 90 days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Recent Reels</Label>
                                        <Select value={recentReels} onValueChange={setRecentReels}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="disabled">Disabled</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Median Views</Label>
                                        <Input type="number" value={medianViews} onChange={(e) => setMedianViews(e.target.value === '' ? '' : parseInt(e.target.value))} />
                                    </div>

                                    <div className="col-span-2 flex items-center space-x-2 py-2">
                                        <Checkbox id="viewsRatio" checked={viewsRatio} onCheckedChange={(c) => setViewsRatio(c as boolean)} />
                                        <Label htmlFor="viewsRatio" className="cursor-pointer">Filter by Views / Followers Ratio ≥ 30%</Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Contact Info</Label>
                                        <Select value={contactInfo} onValueChange={setContactInfo}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any</SelectItem>
                                                <SelectItem value="present">Present</SelectItem>
                                                <SelectItem value="missing">Missing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Website</Label>
                                        <Select value={websitePresence} onValueChange={setWebsitePresence}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any</SelectItem>
                                                <SelectItem value="present">Present</SelectItem>
                                                <SelectItem value="missing">Missing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Account Type</Label>
                                        <Select value={accountType} onValueChange={setAccountType}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any</SelectItem>
                                                <SelectItem value="business">Business</SelectItem>
                                                <SelectItem value="creator">Creator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Business Category</Label>
                                        <Select value={businessCategory} onValueChange={setBusinessCategory}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any</SelectItem>
                                                <SelectItem value="shopping">Shopping</SelectItem>
                                                <SelectItem value="beauty">Beauty</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between py-2 border-t border-border/50 mt-2 pt-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Filter for Influencers Only</Label>
                                            <p className="text-xs text-muted-foreground">Try to identify influencers</p>
                                        </div>
                                        <Switch checked={filterInfluencers} onCheckedChange={setFilterInfluencers} />
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between py-2 border-t border-border/50">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Filter by Verification</Label>
                                            <p className="text-xs text-muted-foreground">Verified accounts only</p>
                                        </div>
                                        <Switch checked={mustBeVerified} onCheckedChange={setMustBeVerified} />
                                    </div>

                                </div>
                            </CardContent>
                        )}
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
                                                        {profile.contact && <div>📞 {profile.contact}</div>}
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
                </div>
            </div>

            <MoveToCampaignModal
                open={isMoveModalOpen}
                onOpenChange={setIsMoveModalOpen}
                candidates={getSelectedCandidates()}
                platform="instagram"
                onSuccess={handleMoveSuccess}
            />

            <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Bulk Edit Keywords</DialogTitle></DialogHeader>
                    <Textarea
                        value={bulkKeywords}
                        onChange={(e) => setBulkKeywords(e.target.value)}
                        placeholder="Enter keywords, one per line"
                        className="min-h-[200px]"
                    />
                    <DialogFooter><Button onClick={saveBulkKeywords}>Save Keywords</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DataOption({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <Label className="font-normal text-sm cursor-pointer" onClick={() => onChange(!checked)}>{label}</Label>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
