'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { MoveToCampaignModal } from '@/components/tools/MoveToCampaignModal';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

export default function TikTokScraperPage() {
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('scraper_history_tiktok')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load history');
        } else {
            // Map DB fields back to the structure expected by the UI if needed
            // But since we save them in a flat structure, we can probably use them directly
            // We need to reconstruct the nested objects for the UI or adapt the UI to flat structure
            // Let's adapt the UI to handle both or map it here.

            // Actually, the UI expects `authorMeta` object for display. 
            // We should ideally store the raw JSON or map it back. 
            // For simplicity and consistency with the previous "flat" saving, let's reconstruct the object.
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
                    // Flattened structure for DB
                    username: item.authorMeta?.name,
                    kol_name: item.authorMeta?.nickName || item.authorMeta.name,
                    tt_followers: item.authorMeta?.fans || 0,
                    avg_views: item.playCount || 0,
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

            if (newItems.length > 0) {
                const { error } = await supabase
                    .from('scraper_history_tiktok')
                    .insert(newItems);

                if (error) throw error;
                toast.success(`Found and saved ${newItems.length} profiles.`);
                fetchHistory(); // Reload to get IDs and consistent state
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

    const handleClearHistory = async () => {
        if (!confirm("Are you sure you want to clear the search history?")) return;

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
    };

    const getSelectedCandidates = () => {
        return searchResults.filter((_, idx) => selectedIndices.has(idx));
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

    const handleMoveSuccess = () => {
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
                            <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-muted-foreground hover:text-destructive hover:bg-white/5">
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
                                        <th className="px-4 py-3">Stats</th>
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
                                                <Input
                                                    value={item.phone || ''}
                                                    onChange={(e) => updateField(idx, 'phone', e.target.value)}
                                                    placeholder="Phone"
                                                    className="h-7 text-xs border-none bg-white/5 focus-visible:bg-secondary/50 placeholder:text-muted-foreground/30"
                                                    containerClassName="mb-1"
                                                />
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
                                            <td className="px-4 py-3 align-top text-xs space-y-1 text-muted-foreground">
                                                <div>Likes: <span className="text-foreground">{item.authorMeta?.heart?.toLocaleString()}</span></div>
                                                <div>Videos: <span className="text-foreground">{item.authorMeta?.video?.toLocaleString()}</span></div>
                                                <div>Views: <span className="text-foreground">{item.playCount?.toLocaleString()}</span></div>
                                                <div>ER: <span className="text-foreground">0%</span></div>
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
        </div>
    );
}
