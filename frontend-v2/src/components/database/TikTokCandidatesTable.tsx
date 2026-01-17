import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Plus, Trash2, Download, FileSpreadsheet, Copy, ArrowUpDown, ArrowUp, ArrowDown, Instagram } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import { useSortableData } from '@/hooks/useSortableData';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
} from "@/components/ui/alert-dialog";

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
    const router = useRouter();
    const [candidates, setCandidates] = useState<TikTokCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

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

    const initiateDeleteCandidate = (id: string) => {
        setCandidateToDelete(id);
    };

    const confirmDeleteCandidate = async () => {
        if (!candidateToDelete) return;

        const { error } = await supabase
            .from('candidates_tiktok')
            .delete()
            .eq('id', candidateToDelete);

        if (error) toast.error('Failed to delete candidate');
        else {
            toast.success('Candidate deleted');
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(candidateToDelete);
                return next;
            });
        }
        setCandidateToDelete(null);
    };

    const initiateBulkDelete = () => {
        if (selectedIds.size === 0) return;
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
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
        setShowBulkDeleteConfirm(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCandidates.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
        }
    };

    const handleExportCSV = () => {
        if (filteredCandidates.length === 0) {
            toast.error("No candidates to export");
            return;
        }

        if (filteredCandidates.some(c => c.status === 'New')) {
            toast.error("Cannot export while there are unreviewed candidates.");
            return;
        }

        const headers = [
            "Name", "Username", "Followers", "Likes", "Videos", "Avg Views", "ER", "Contact", "Email", "Profile URL", "Tier", "Category", "Region", "Segment", "Status"
        ];

        const csvContent = [
            headers.join(","),
            ...filteredCandidates.map(c => [
                `"${c.kol_name || ''}"`,
                `"${c.username || ''}"`,
                c.tt_followers || 0,
                c.total_likes || 0,
                c.total_videos || 0,
                c.avg_views || 0,
                `${c.er || 0}%`,
                `"${c.contact || ''}"`,
                `"${c.email || ''}"`,
                `"${c.profile_url || ''}"`,
                `"${c.tier || ''}"`,
                `"${c.category || ''}"`,
                `"${c.region || ''}"`,
                `"${c.segment || ''}"`,
                `"${c.status || ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `tiktok_candidates_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        if (filteredCandidates.length === 0) {
            toast.error("No candidates to export");
            return;
        }

        if (filteredCandidates.some(c => c.status === 'New')) {
            toast.error("Cannot export while there are unreviewed candidates.");
            return;
        }

        const data = filteredCandidates.map(c => ({
            Name: c.kol_name,
            Username: c.username,
            Followers: c.tt_followers,
            Likes: c.total_likes,
            Videos: c.total_videos,
            "Avg Views": c.avg_views,
            ER: `${c.er}%`,
            Contact: c.contact,
            Email: c.email,
            "Profile URL": c.profile_url,
            Tier: c.tier,
            Category: c.category,
            Region: c.region,
            Segment: c.segment,
            Status: c.status
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Candidates");
        XLSX.writeFile(wb, `tiktok_candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleCopyKeywords = () => {
        if (filteredCandidates.length === 0) {
            toast.error("No candidates to copy");
            return;
        }

        if (filteredCandidates.some(c => c.status === 'New')) {
            toast.error("Cannot copy while there are unreviewed candidates.");
            return;
        }

        const headers = ["Name", "Username", "Followers", "Likes", "Videos", "Avg Views", "ER", "Contact", "Email", "Tier", "Status"];
        const rows = filteredCandidates.map(c => [
            c.kol_name,
            c.username,
            c.tt_followers,
            c.total_likes,
            c.total_videos,
            c.avg_views,
            `${c.er}%`,
            c.contact,
            c.email,
            c.tier,
            c.status
        ].join("\t"));

        const text = [headers.join("\t"), ...rows].join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard (Google Sheets friendly)");
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

    const { items: sortedCandidates, requestSort, sortConfig } = useSortableData(filteredCandidates);

    const getSortIcon = (columnName: string) => {
        if (!sortConfig || sortConfig.key !== columnName) {
            return <ArrowUpDown className="w-3 h-3 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ?
            <ArrowUp className="w-3 h-3" /> :
            <ArrowDown className="w-3 h-3" />;
    };

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
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={initiateBulkDelete}
                            className="gap-2"
                        >
                            <Trash2 size={16} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/tools/tiktok-scraper')}
                        className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                        title="Find TikTok KOLs"
                    >
                        <Search size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/tools/ig-scraper')}
                        className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                        title="Find IG KOLs"
                    >
                        <Instagram size={16} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                                <Download size={16} />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                                Export to CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export to Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleCopyKeywords} className="cursor-pointer">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy for Google Sheets
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
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
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('kol_name')}>
                                <div className="flex items-center gap-1">
                                    Profile
                                    {getSortIcon('kol_name')}
                                </div>
                            </th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('tt_followers')}>
                                <div className="flex items-center gap-1">
                                    Followers
                                    {getSortIcon('tt_followers')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('total_likes')}>
                                <div className="flex items-center gap-1">
                                    Likes
                                    {getSortIcon('total_likes')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('total_videos')}>
                                <div className="flex items-center gap-1">
                                    Videos
                                    {getSortIcon('total_videos')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('avg_views')}>
                                <div className="flex items-center gap-1">
                                    Avg Views
                                    {getSortIcon('avg_views')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('er')}>
                                <div className="flex items-center gap-1">
                                    ER
                                    {getSortIcon('er')}
                                </div>
                            </th>
                            <th className="px-4 py-3">Details</th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('status')}>
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedCandidates.map((candidate) => (
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
                                        onClick={() => initiateDeleteCandidate(candidate.id)}
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

            <AlertDialog
                isOpen={!!candidateToDelete}
                onClose={() => setCandidateToDelete(null)}
                onConfirm={confirmDeleteCandidate}
                title="Are you sure?"
                description="This action cannot be undone. This will permanently delete the candidate."
                confirmText="Delete"
                variant="destructive"
            />

            <AlertDialog
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={confirmBulkDelete}
                title="Are you sure?"
                description={`This action cannot be undone. This will permanently delete ${selectedIds.size} candidates.`}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
