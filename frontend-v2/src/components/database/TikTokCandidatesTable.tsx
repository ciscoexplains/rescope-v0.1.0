import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
                // If campaignId is provided, filter events
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
            // toast.error("Failed to load candidates");
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
            // Realtime subscription should handle removal from UI, but we can optimistically update too if needed
            // setCandidates(prev => prev.filter(c => !selectedIds.has(c.id)));
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
        <div className="flex flex-col h-full bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-card">
                <div className="flex items-center gap-2 relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search TikTok candidates..."
                        className="pl-9 w-full sm:w-64 bg-background border-input text-foreground"
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

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-foreground">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 w-[40px]">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    checked={filteredCandidates.length > 0 && selectedIds.size === filteredCandidates.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Username</th>
                            <th className="px-6 py-3">Followers</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3">Tier</th>
                            <th className="px-6 py-3">ER%</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="bg-card hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                        checked={selectedIds.has(candidate.id)}
                                        onChange={() => toggleSelect(candidate.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 font-medium text-foreground">{candidate.kol_name}</td>
                                <td className="px-6 py-4 text-muted-foreground">{candidate.username}</td>
                                <td className="px-6 py-4 text-muted-foreground">{candidate.tt_followers?.toLocaleString()}</td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    <div className="flex flex-col text-xs">
                                        <span>{candidate.contact}</span>
                                        <span className="text-muted-foreground/70">{candidate.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                        ${candidate.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                            candidate.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                candidate.tier === 'Mid/Macro' ? 'bg-purple-900/30 text-purple-400' :
                                                    'bg-yellow-900/30 text-yellow-400'}`}>
                                        {candidate.tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">{candidate.er}%</td>
                                <td className="px-6 py-4">
                                    <select
                                        value={candidate.status}
                                        onChange={(e) => updateStatus(candidate.id, e.target.value)}
                                        className={`px-2 py-1 rounded-full text-xs font-medium bg-transparent border-0 cursor-pointer
                                        ${candidate.status === 'New' ? 'text-blue-400' :
                                                candidate.status === 'Reviewed' ? 'text-green-400' :
                                                    'text-zinc-400'}`}
                                    >
                                        <option value="New">New</option>
                                        <option value="Reviewed">Reviewed</option>
                                        <option value="Trashed">Trashed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteCandidate(candidate.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
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
