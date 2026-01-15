import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TikTokCandidate {
    id: string;
    kol_name: string;
    username: string;
    tt_followers: number;
    contact: string;
    email: string;
    tier: string;
    status: string;
    er: number;
    campaign_id?: string;
    profile_url?: string;
    is_verified?: boolean;
    category?: string;
    region?: string;
    segment?: string;
    total_likes?: number;
    total_videos?: number;
    avg_views?: number;
    avatar?: string;
}

interface TikTokCandidatesTableProps {
    campaignId?: string;
}

export default function TikTokCandidatesTable({ campaignId }: TikTokCandidatesTableProps) {
    const [candidates, setCandidates] = useState<TikTokCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchCandidates();

        const channel = supabase
            .channel('candidates_tiktok_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates_tiktok' }, (payload) => {
                if (campaignId && (payload.new as any).campaign_id !== campaignId) return;

                if (payload.eventType === 'INSERT') {
                    setCandidates((prev) => [payload.new as TikTokCandidate, ...prev]);
                }
                if (payload.eventType === 'UPDATE') {
                    setCandidates((prev) => prev.map((item) => item.id === payload.new.id ? payload.new as TikTokCandidate : item));
                }
                if (payload.eventType === 'DELETE') {
                    setCandidates((prev) => prev.filter((item) => item.id !== payload.old.id));
                    setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.delete(payload.old.id);
                        return next;
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('candidates_tiktok')
                .select('*')
                .order('created_at', { ascending: false });

            if (campaignId) {
                query = query.eq('campaign_id', campaignId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setCandidates(data as TikTokCandidate[]);
        } catch (error: any) {
            console.error("Error fetching candidates:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('candidates_tiktok')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) toast.error('Failed to update status');
        else toast.success('Status updated');
    };

    const deleteCandidate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this candidate?')) return;

        const { error } = await supabase
            .from('candidates_tiktok')
            .delete()
            .eq('id', id);

        if (error) toast.error('Failed to delete candidate');
        else {
            toast.success('Candidate deleted');
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const bulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} candidates?`)) return;

        const idsToDelete = Array.from(selectedIds);
        const { error } = await supabase
            .from('candidates_tiktok')
            .delete()
            .in('id', idsToDelete);

        if (error) toast.error('Failed to delete candidates');
        else {
            toast.success(`${idsToDelete.length} candidates deleted`);
            setSelectedIds(new Set());
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCandidates.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredCandidates = candidates.filter(candidate => {
        const query = searchQuery.toLowerCase();
        return (
            candidate.kol_name?.toLowerCase().includes(query) ||
            candidate.username?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-lg shadow-none border-none overflow-hidden bg-transparent">
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" size={18} />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search TikTok candidates..."
                        containerClassName="mb-0"
                        className="pl-10 h-10 w-full bg-white/5 border-none text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:bg-secondary/50 transition-all rounded-xl"
                    />
                </div>
                {selectedIds.size > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={bulkDelete}
                        className="gap-2"
                    >
                        <Trash2 size={16} />
                        Delete Selected ({selectedIds.size})
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-secondary/10">
                <table className="w-full text-sm text-left text-foreground">
                    <thead className="text-xs text-muted-foreground uppercase bg-white/5 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 w-[40px]">
                                <Checkbox
                                    checked={filteredCandidates.length > 0 && selectedIds.size === filteredCandidates.length}
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
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-4 align-top">
                                    <Checkbox
                                        checked={selectedIds.has(candidate.id)}
                                        onCheckedChange={() => toggleSelect(candidate.id)}
                                        className="border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-start gap-3">
                                        {candidate.avatar && (
                                            <img src={candidate.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        )}
                                        <div>
                                            <div className="font-medium flex items-center gap-1">
                                                {candidate.kol_name}
                                                {candidate.is_verified && <span className="text-blue-500 text-[10px] bg-blue-500/10 px-1 rounded">Verified</span>}
                                            </div>
                                            <a href={candidate.profile_url || `https://tiktok.com/@${candidate.username}`} target="_blank" className="text-xs text-blue-500 hover:underline">
                                                @{candidate.username}
                                            </a>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium 
                                                    ${candidate.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                                        candidate.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                            candidate.tier === 'Mid/Macro' ? 'bg-purple-900/30 text-purple-400' :
                                                                'bg-yellow-900/30 text-yellow-400'}`}>
                                                    {candidate.tier}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-top text-xs space-y-1">
                                    {candidate.contact && (
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Phone">
                                            📞 {candidate.contact}
                                        </div>
                                    )}
                                    {candidate.email && (
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Email">
                                            ✉️ {candidate.email}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 align-top text-sm font-medium">
                                    {candidate.tt_followers?.toLocaleString()}
                                </td>
                                <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                                    <span className="text-foreground">{candidate.total_likes?.toLocaleString() || 0}</span>
                                </td>
                                <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                                    <span className="text-foreground">{candidate.total_videos?.toLocaleString() || 0}</span>
                                </td>
                                <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                                    <span className="text-foreground">{candidate.avg_views?.toLocaleString() || 0}</span>
                                </td>
                                <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                                    <span className="text-foreground">{candidate.er || 0}%</span>
                                </td>
                                <td className="px-4 py-4 align-top text-xs text-muted-foreground space-y-1">
                                    <div>Cat: <span className="text-foreground">{candidate.category || '-'}</span></div>
                                    <div>Reg: <span className="text-foreground">{candidate.region || '-'}</span></div>
                                    <div>Seg: <span className="text-foreground">{candidate.segment || '-'}</span></div>
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <Select
                                        value={candidate.status}
                                        onValueChange={(value) => updateStatus(candidate.id, value)}
                                    >
                                        <SelectTrigger className={`h-7 w-[90px] border-none bg-transparent text-xs font-medium focus:ring-0 focus:ring-offset-0 px-2
                                            ${candidate.status === 'New' ? 'text-blue-400' :
                                                candidate.status === 'Reviewed' ? 'text-green-400' :
                                                    'text-zinc-400'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="New" className="text-blue-400">New</SelectItem>
                                            <SelectItem value="Reviewed" className="text-green-400">Reviewed</SelectItem>
                                            <SelectItem value="Trashed" className="text-zinc-400">Trashed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="px-4 py-4 align-top text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteCandidate(candidate.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                            <tr>
                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">
                                    No candidates found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
