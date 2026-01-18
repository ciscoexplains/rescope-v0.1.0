'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowRight, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { MoveToCampaignModal } from '@/components/tools/MoveToCampaignModal';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2, MessageCircle } from 'lucide-react';
import { AlertDialog } from "@/components/ui/alert-dialog";

export default function TikTokScraperPage() {
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('scraper_history_tiktok')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load history');
        } else {
            const mappedData = (data || []).map(item => ({
                ...item,
                authorMeta: {
                    name: item.username,
                    nickName: item.kol_name,
                    fans: item.tt_followers,
                    signature: item.bio || '',
                    avatar: item.avatar,
                    heart: item.total_likes || 0,
                    video: item.total_videos || 0,
                    verified: item.is_verified
                },
                playCount: item.avg_views
            }));
            setSearchResults(mappedData);
        }
    };

    const calculateTier = (followers: number) => {
        if (followers > 1000000) return 'Mega';
        if (followers >= 100000) return 'Mid/Macro';
        if (followers >= 10000) return 'Micro';
        if (followers >= 2000) return 'Nano';
        return 'Nano';
    };

    const extractContactInfo = (bio: string) => {
        if (!bio) return { email: '', phone: '' };

        // Improved Email Regex: Matches common email patterns
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

        // Improved Phone Regex: 
        // Handles:
        // - International (e.g. +62...)
        // - Local ID (e.g. 08...)
        // - Dash/Space separators
        // - Minimum length check to avoid random numbers like "2023"
        const phoneRegex = /(?:\+62|62|0)8[1-9][0-9]{6,11}/g;
        // Note: The above is strict for ID numbers. 
        // A more general scraper regex that catches "Phone: ..." or just numbers might be better, 
        // but let's start with a decent pattern that strips separators first for checking.

        const emails = bio.match(emailRegex);

        // Clean bio for phone extraction (remove spaces/dashes to simpler matching)
        const cleanBio = bio.replace(/[- .]/g, '');
        const phones = cleanBio.match(phoneRegex);

        // Fallback: Try matching in original text for formatted numbers if strict match fails, 
        // but often stripping is better for specific formats like +62. 
        // Let's stick to the cleaner approach for now.

        return {
            email: emails ? emails[0] : '',
            phone: phones ? phones[0].replace(/^62/, '0') : '' // Normalize to 08... format or keep as is? 
            // Let's keep specific format or normalize to input preference.
            // User likely wants to click to whatsapp. 
            // Whatsapp needs international format usually.
            // Let's just return what we matched primarily, maybe formatted.
        };
    };

    const extractContactInfoRobust = (bio: string) => {
        if (!bio) return { email: '', phone: '' };

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

        // Strategy:
        // 1. Clean the bio of common separators (dashes, dots, spaces) to make matching easier.
        // 2. Look for patterns starting with 08 or 628 followed by 8-12 digits.

        // Normalized match:
        // Remove all non-alphanumeric chars (keep +) to concatenate numbers
        const cleanBio = bio.replace(/[^a-zA-Z0-9+]/g, '');

        // Regex for cleaned string:
        // (?:^|[^\d]) matches start or non-digit (conceptually, but we cleaned it, so just look for the number pattern)
        // Since we cleaned it, text is merged. "WA 0812" becomes "WA0812".
        // match 628... or 08...
        // We look for a sequence of digits that looks like an ID phone number.
        // 628xx... (min 10 total length usually) or 08xx...

        const phoneRegexStrict = /(?:\+?62|0)8\d{8,12}/g;

        const emails = bio.match(emailRegex);
        const phones = cleanBio.match(phoneRegexStrict); // Check against cleaned string

        let phone = '';
        if (phones && phones.length > 0) {
            phone = phones[0];
            if (phone.startsWith('0')) {
                phone = '62' + phone.substring(1);
            } else if (phone.startsWith('+')) {
                phone = phone.substring(1);
            }
        } else {
            // Fallback: Try original bio with loose regex if cleaning merged things too aggressively 
            // or if there are other formats.
            // Matches: (08xx) xxx-xxx or 08xx-xxx-xxx or 08xx.xxx.xxx
            const looseRegex = /(?:\+?62|0)\s?8\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,5}\b/g;
            const looseMatches = bio.match(looseRegex);
            if (looseMatches) {
                phone = looseMatches[0].replace(/[^0-9]/g, '');
                if (phone.startsWith('0')) phone = '62' + phone.substring(1);
                else if (phone.startsWith('62')) { /* ok */ }
            }
        }

        return {
            email: emails ? emails[0].toLowerCase() : '',
            phone: phone
        };
    };

    const handleSearch = async () => {
        if (!query) return toast.error('Enter a search query');
        setLoading(true);
        // Don't clear selection or results immediately, we append

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You must be logged in to save results');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/apify/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, limit }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');

            const newItems = (data.results || []).map((item: any) => {
                const { email, phone } = extractContactInfoRobust(item.authorMeta?.signature || '');
                return {
                    user_id: user.id, // Add isolation
                    // Flattened structure for DB
                    username: item.authorMeta?.name,
                    kol_name: item.authorMeta?.nickName || item.authorMeta.name,
                    tt_followers: item.authorMeta?.fans || 0,
                    avg_views: 0,
                    status: 'New',
                    tier: calculateTier(item.authorMeta?.fans || 0),
                    tiktok: item.authorMeta?.name,
                    avatar: item.authorMeta?.avatar,
                    contact: phone,
                    email: email,
                    er: 0,
                    profile_url: `https://tiktok.com/@${item.authorMeta?.name}`,
                    is_verified: item.authorMeta?.verified || false,
                    category: '',
                    region: '',
                    segment: 'Custom',

                    // Added missing fields
                    bio: item.authorMeta?.signature || '',
                    total_likes: item.authorMeta?.heart || 0,
                    total_videos: item.authorMeta?.video || 0
                };
            });

            // Deduplicate against existing history
            const existingUsernames = new Set(searchResults.map(r => r.username.toLowerCase()));
            const uniqueNewItems = newItems.filter((item: any) => !existingUsernames.has(item.username.toLowerCase()));

            if (uniqueNewItems.length > 0) {
                const { error } = await supabase
                    .from('scraper_history_tiktok')
                    .insert(uniqueNewItems);

                if (error) throw error;

                const skippedCount = newItems.length - uniqueNewItems.length;
                toast.success(`Saved ${uniqueNewItems.length} new profiles.${skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ''}`);
                fetchHistory(); // Reload to get IDs and consistent state
            } else if (newItems.length > 0) {
                toast.info(`All ${newItems.length} results already exist in history.`);
            } else {
                toast.info('No results found');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === searchResults.length) {
            setSelectedIndices(new Set());
        } else {
            const allIndices = new Set(searchResults.map((_, idx) => idx));
            setSelectedIndices(allIndices);
        }
    };

    const toggleSelect = (index: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const updateField = async (index: number, field: string, value: any) => {
        // Optimistic update
        const newResults = [...searchResults];
        newResults[index] = { ...newResults[index], [field]: value };
        setSearchResults(newResults);

        // Update DB
        const item = newResults[index];
        if (item.id) {
            // Map UI fields to DB columns if they differ
            const dbField = field === 'phone' ? 'contact' : field;

            const { error } = await supabase
                .from('scraper_history_tiktok')
                .update({ [dbField]: value })
                .eq('id', item.id);

            if (error) {
                console.error("Failed to update history", error);
                toast.error("Failed to save change");
            }
        }
    };

    const initiateClearHistory = () => {
        setShowClearConfirm(true);
    };

    const confirmClearHistory = async () => {
        const { error } = await supabase
            .from('scraper_history_tiktok')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            toast.error("Failed to clear history");
        } else {
            setSearchResults([]);
            setSelectedIndices(new Set());
            toast.success("History cleared");
        }
        setShowClearConfirm(false);
    };

    const getSelectedCandidates = () => {
        return searchResults.filter((_, idx) => selectedIndices.has(idx));
    };

    const handleAnalyze = async () => {
        const selectedItems = searchResults.filter((_, idx) => selectedIndices.has(idx));
        if (selectedItems.length === 0) return toast.error("Select profiles to analyze");

        setAnalyzing(true);
        try {
            const profiles = selectedItems.map(item => item.username || item.authorMeta?.name);

            const res = await fetch('/api/apify/analyze-tiktok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profiles })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Analysis failed');

            const results = data.results || {};
            let updatedCount = 0;

            const newResults = [...searchResults];

            // Update results that match
            for (let i = 0; i < newResults.length; i++) {
                const item = newResults[i];
                const username = item.username || item.authorMeta?.name;

                if (results[username]) {
                    const stats = results[username];
                    newResults[i] = {
                        ...item,
                        avg_views: stats.avg_views,
                        er: stats.er
                    };
                    updatedCount++;

                    // Update DB
                    if (item.id) {
                        await supabase
                            .from('scraper_history_tiktok')
                            .update({
                                avg_views: stats.avg_views,
                                er: stats.er
                            })
                            .eq('id', item.id);
                    }
                }
            }

            setSearchResults(newResults);
            toast.success(`Analyzed ${updatedCount} profiles successfully`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleScanContacts = async () => {
        let updatedCount = 0;
        const newResults = [...searchResults];

        for (let i = 0; i < newResults.length; i++) {
            const item = newResults[i];
            // Skip if both already exist
            if (item.phone && item.email) continue;

            // Re-extract
            const { email, phone } = extractContactInfoRobust(item.authorMeta?.signature || item.bio || '');

            let changed = false;
            let updates: any = {};

            if (!item.phone && phone) {
                item.phone = phone;
                updates.contact = phone;
                changed = true;
            }
            if (!item.email && email) {
                item.email = email;
                updates.email = email;
                changed = true;
            }

            if (changed) {
                updatedCount++;
                // Update DB
                if (item.id) {
                    await supabase
                        .from('scraper_history_tiktok')
                        .update(updates)
                        .eq('id', item.id);
                }
            }
        }

        if (updatedCount > 0) {
            setSearchResults(newResults);
            toast.success(`Updated contacts for ${updatedCount} profiles.`);
        } else {
            toast.info('No new contacts found in existing bios.');
        }
    };

    const handleMoveSuccess = async () => {
        const selectedItems = getSelectedCandidates();
        const idsToDelete = selectedItems.map(item => item.id).filter(Boolean);

        if (idsToDelete.length > 0) {
            const { error } = await supabase
                .from('scraper_history_tiktok')
                .delete()
                .in('id', idsToDelete);

            if (error) {
                console.error("Error removing moved items from history:", error);
                toast.error("Failed to remove moved items from history");
            } else {
                setSearchResults(prev => prev.filter(item => !idsToDelete.includes(item.id)));
                // Toast is already shown by modal for the move.
            }
        }
        setSelectedIndices(new Set());
    };

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="TikTok Scraper" />

            {/* Search Controls */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20">
                <Input
                    placeholder="Search Query (e.g. skin care)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 border-none bg-white/5 focus-visible:bg-secondary/50 placeholder:text-muted-foreground/50 transition-all"
                    containerClassName="mb-0 w-full"
                />

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Limit:</span>
                    <Input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        min={1}
                        max={50}
                        className="w-[80px] border-none bg-white/5 focus-visible:bg-secondary/50 transition-all"
                        containerClassName="mb-0"
                    />
                </div>

                <Button onClick={handleSearch} disabled={loading} className="min-w-[120px] shadow-none">
                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                    {loading ? 'Scraping' : 'Search'}
                </Button>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-0">
                        <div>
                            <CardTitle>Results ({searchResults.length})</CardTitle>
                            <CardDescription>Review candidates before saving to the database.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleScanContacts} className="text-muted-foreground hover:text-primary hover:bg-white/5">
                                <Search size={16} className="mr-2" />
                                Scan Contacts
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAnalyze}
                                disabled={analyzing || selectedIndices.size === 0}
                                className="text-muted-foreground hover:text-primary hover:bg-white/5"
                            >
                                {analyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <BarChart2 size={16} className="mr-2" />}
                                Analyze ({selectedIndices.size})
                            </Button>
                            <Button variant="ghost" size="sm" onClick={initiateClearHistory} className="text-muted-foreground hover:text-destructive hover:bg-white/5">
                                <Trash2 size={16} className="mr-2" />
                                Clear Results
                            </Button>
                            {selectedIndices.size > 0 && (
                                <Button onClick={() => setIsMoveModalOpen(true)} className="gap-2 shadow-none">
                                    <ArrowRight size={16} />
                                    Move to Campaign ({selectedIndices.size})
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="rounded-xl overflow-hidden overflow-x-auto bg-secondary/10">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-xs uppercase text-muted-foreground whitespace-nowrap">
                                    <tr>
                                        <th className="px-4 py-3 w-[40px]">
                                            <Checkbox
                                                checked={searchResults.length > 0 && selectedIndices.size === searchResults.length}
                                                onCheckedChange={() => toggleSelectAll()}
                                                className="border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </th>
                                        <th className="px-4 py-3">Profile</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Followers</th>
                                        <th className="px-4 py-3">Likes</th>
                                        <th className="px-4 py-3">Videos</th>
                                        <th className="px-4 py-3">Avg Views</th>
                                        <th className="px-4 py-3">ER</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {searchResults.map((item: any, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 align-top">
                                                <Checkbox
                                                    checked={selectedIndices.has(idx)}
                                                    onCheckedChange={() => toggleSelect(idx)}
                                                    className="border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-3">
                                                    {item.authorMeta?.avatar && (
                                                        <img src={item.authorMeta.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium flex items-center gap-1">
                                                            {item.authorMeta?.nickName || item.authorMeta?.name}
                                                            {item.is_verified && <span className="text-blue-500 text-[10px] bg-blue-500/10 px-1 rounded">Verified</span>}
                                                        </div>
                                                        <Link href={`https://www.tiktok.com/@${item.authorMeta?.name}`} target="_blank" className="text-xs text-blue-500 hover:underline">
                                                            @{item.authorMeta?.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-[200px]" title={item.authorMeta?.signature}>
                                                            {item.authorMeta?.signature || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs space-y-2">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Input
                                                        value={item.phone || ''}
                                                        onChange={(e) => updateField(idx, 'phone', e.target.value)}
                                                        placeholder="Phone"
                                                        className="h-7 text-xs border-none bg-white/5 focus-visible:bg-secondary/50 placeholder:text-muted-foreground/30 flex-1"
                                                        containerClassName="mb-0 flex-1"
                                                    />
                                                    {item.phone && (
                                                        <a
                                                            href={`https://wa.me/${item.phone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-7 w-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-[#25D366]/20 transition-colors text-[#25D366]"
                                                            title="Chat on WhatsApp"
                                                        >
                                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                                <Input
                                                    value={item.email || ''}
                                                    onChange={(e) => updateField(idx, 'email', e.target.value)}
                                                    placeholder="Email"
                                                    className="h-7 text-xs border-none bg-white/5 focus-visible:bg-secondary/50 placeholder:text-muted-foreground/30"
                                                    containerClassName="mb-0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="text-sm font-medium">{item.authorMeta?.fans?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                                <span className="text-foreground">{item.authorMeta?.heart?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                                <span className="text-foreground">{item.authorMeta?.video?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                                <span className="text-foreground">{item.avg_views?.toLocaleString() || 0}</span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                                <span className="text-foreground">{item.er || 0}%</span>
                                            </td>
                                            <td className="px-4 py-3 align-top space-y-2 min-w-[150px]">
                                                <select
                                                    className="w-full h-7 rounded-md border-none bg-white/5 px-2 text-xs focus:bg-secondary/50 appearance-none cursor-pointer text-foreground"
                                                    value={item.category || ''}
                                                    onChange={(e) => updateField(idx, 'category', e.target.value)}
                                                >
                                                    <option value="" className="bg-zinc-900 text-muted-foreground">Select Category</option>
                                                    <option value="Beauty & Fashion" className="bg-zinc-900">Beauty & Fashion</option>
                                                    <option value="Food & Beverage" className="bg-zinc-900">Food & Beverage</option>
                                                    <option value="Health & Wellness" className="bg-zinc-900">Health & Wellness</option>
                                                    <option value="Technology & Gadgets" className="bg-zinc-900">Technology & Gadgets</option>
                                                    <option value="Travel & Lifestyle" className="bg-zinc-900">Travel & Lifestyle</option>
                                                    <option value="Entertainment & Gaming" className="bg-zinc-900">Entertainment & Gaming</option>
                                                    <option value="Education & Career" className="bg-zinc-900">Education & Career</option>
                                                    <option value="Sports & Outdoors" className="bg-zinc-900">Sports & Outdoors</option>
                                                    <option value="Mom & Baby" className="bg-zinc-900">Mom & Baby</option>
                                                    <option value="Home & Living" className="bg-zinc-900">Home & Living</option>
                                                    <option value="Finance & Business" className="bg-zinc-900">Finance & Business</option>
                                                    <option value="Other" className="bg-zinc-900">Other</option>
                                                </select>
                                                <Input
                                                    value={item.region || ''}
                                                    onChange={(e) => updateField(idx, 'region', e.target.value)}
                                                    placeholder="Region"
                                                    className="h-7 text-xs border-none bg-white/5 focus-visible:bg-secondary/50 placeholder:text-muted-foreground/30"
                                                    containerClassName="mb-0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top space-y-2 min-w-[140px]">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1
                                                    ${item.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                                        item.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                            item.tier === 'Mid/Macro' ? 'bg-purple-900/30 text-purple-400' :
                                                                'bg-yellow-900/30 text-yellow-400'}`}>
                                                    {item.tier}
                                                </span>
                                                <select
                                                    className="w-full h-7 rounded-md border-none bg-white/5 px-2 text-xs focus:bg-secondary/50 appearance-none cursor-pointer"
                                                    value={item.segment || 'Custom'}
                                                    onChange={(e) => updateField(idx, 'segment', e.target.value)}
                                                >
                                                    <option value="Custom" className="bg-zinc-900">Custom</option>
                                                    <option value="High-end" className="bg-zinc-900">High-end</option>
                                                    <option value="Mid-end" className="bg-zinc-900">Mid-end</option>
                                                    <option value="Lower-end" className="bg-zinc-900">Lower-end</option>
                                                </select>
                                            </td>
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
                onSuccess={handleMoveSuccess}
            />

            <AlertDialog
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={confirmClearHistory}
                title="Clear Search History?"
                description="This will permanently delete your entire TikTok scraper history. This action cannot be undone."
                confirmText="Clear History"
                variant="destructive"
            />
        </div>
    );
}
