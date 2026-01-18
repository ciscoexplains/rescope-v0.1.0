'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, Download, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

interface InstagramProfile {
    id: string;
    username: string;
    full_name: string;
    bio: string;
    avatar: string;
    followers: number;
    following: number;
    posts_count: number;
    email: string;
    contact: string;
    website: string;
    tier: string;
    status: string;
    er: number;
    median_views: number;
    profile_url: string;
    is_verified: boolean;
    category?: string;
    region?: string;
    segment?: string;
}

export default function InstagramHistoryTable() {
    const [profiles, setProfiles] = useState<InstagramProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchProfiles();

        const channel = supabase
            .channel('scraper_history_instagram_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scraper_history_instagram' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setProfiles((prev) => [payload.new as InstagramProfile, ...prev]);
                }
                if (payload.eventType === 'UPDATE') {
                    setProfiles((prev) => prev.map((item) => item.id === payload.new.id ? payload.new as InstagramProfile : item));
                }
                if (payload.eventType === 'DELETE') {
                    setProfiles((prev) => prev.filter((item) => item.id !== payload.old.id));
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
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('scraper_history_instagram')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            console.error('Error fetching profiles:', error);
            toast.error('Failed to load Instagram profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('scraper_history_instagram')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Profile deleted');
        } catch (error: any) {
            console.error('Error deleting profile:', error);
            toast.error('Failed to delete profile');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        try {
            const { error } = await supabase
                .from('scraper_history_instagram')
                .delete()
                .in('id', Array.from(selectedIds));

            if (error) throw error;
            toast.success(`Deleted ${selectedIds.size} profiles`);
            setSelectedIds(new Set());
        } catch (error: any) {
            console.error('Error bulk deleting:', error);
            toast.error('Failed to delete profiles');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('scraper_history_instagram')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success('Status updated');
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const exportToExcel = () => {
        const selectedProfiles = profiles.filter(p => selectedIds.has(p.id));
        const dataToExport = (selectedProfiles.length > 0 ? selectedProfiles : profiles).map(p => ({
            'Username': p.username,
            'Full Name': p.full_name,
            'Followers': p.followers,
            'Following': p.following,
            'Posts': p.posts_count,
            'ER': p.er,
            'Median Views': p.median_views,
            'Tier': p.tier,
            'Email': p.email,
            'Phone': p.contact,
            'Website': p.website,
            'Status': p.status,
            'Profile URL': p.profile_url,
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Instagram Profiles');
        XLSX.writeFile(wb, `instagram_profiles_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast.success(`Exported ${dataToExport.length} profiles to Excel`);
    };

    const exportToCSV = () => {
        const selectedProfiles = profiles.filter(p => selectedIds.has(p.id));
        const dataToExport = selectedProfiles.length > 0 ? selectedProfiles : profiles;

        const headers = ['Username', 'Full Name', 'Followers', 'Following', 'Posts', 'ER', 'Median Views', 'Tier', 'Email', 'Phone', 'Website', 'Status', 'Profile URL'];
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(p => [
                p.username,
                `"${p.full_name}"`,
                p.followers,
                p.following,
                p.posts_count,
                p.er,
                p.median_views,
                p.tier,
                p.email,
                p.contact,
                p.website,
                p.status,
                p.profile_url,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram_profiles_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        toast.success(`Exported ${dataToExport.length} profiles to CSV`);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProfiles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProfiles.map(p => p.id)));
        }
    };

    const filteredProfiles = profiles.filter(profile =>
        profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const { items: sortedProfiles, requestSort, sortConfig } = useSortableData(filteredProfiles);

    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />;
        return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input
                    placeholder="Search by username, name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm bg-white/5 border-white/10"
                />

                <div className="flex gap-2 ml-auto">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="gap-2"
                        >
                            <Trash2 size={16} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                                <Download size={16} />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={exportToExcel}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToCSV}>
                                <Download className="mr-2 h-4 w-4" />
                                CSV (.csv)
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
                                    checked={filteredProfiles.length > 0 && selectedIds.size === filteredProfiles.length}
                                    onCheckedChange={() => toggleSelectAll()}
                                    className="border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('username')}>
                                <div className="flex items-center gap-1">
                                    Profile
                                    {getSortIcon('username')}
                                </div>
                            </th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('followers')}>
                                <div className="flex items-center gap-1">
                                    Followers
                                    {getSortIcon('followers')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('following')}>
                                <div className="flex items-center gap-1">
                                    Following
                                    {getSortIcon('following')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('tier')}>
                                <div className="flex items-center gap-1">
                                    Tier
                                    {getSortIcon('tier')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('median_views')}>
                                <div className="flex items-center gap-1">
                                    Median Views
                                    {getSortIcon('median_views')}
                                </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group" onClick={() => requestSort('er')}>
                                <div className="flex items-center gap-1">
                                    ER
                                    {getSortIcon('er')}
                                </div>
                            </th>
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
                        {sortedProfiles.map((profile) => (
                            <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-4 align-top">
                                    <Checkbox
                                        checked={selectedIds.has(profile.id)}
                                        onCheckedChange={() => toggleSelect(profile.id)}
                                        className="border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex items-start gap-3">
                                        {profile.avatar && (
                                            <img src={profile.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        )}
                                        <div>
                                            <div className="font-medium flex items-center gap-1">
                                                {profile.full_name}
                                                {profile.is_verified && <span className="text-blue-500 text-[10px] bg-blue-500/10 px-1 rounded">Verified</span>}
                                            </div>
                                            <a href={profile.profile_url} target="_blank" className="text-xs text-blue-500 hover:underline">
                                                @{profile.username}
                                            </a>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium 
                                                    ${profile.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                                        profile.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                            profile.tier === 'Mid' ? 'bg-purple-900/30 text-purple-400' :
                                                                'bg-yellow-900/30 text-yellow-400'}`}>
                                                    {profile.tier}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-top text-xs space-y-1">
                                    {profile.contact && (
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Phone">
                                            📞 {profile.contact}
                                        </div>
                                    )}
                                    {profile.email && (
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Email">
                                            ✉️ {profile.email}
                                        </div>
                                    )}
                                    {profile.website && (
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer" title="Website">
                                            🌐 <a href={profile.website} target="_blank" className="hover:underline truncate max-w-[150px]">{profile.website}</a>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 align-top">{profile.followers?.toLocaleString()}</td>
                                <td className="px-4 py-4 align-top">{profile.following?.toLocaleString()}</td>
                                <td className="px-4 py-4 align-top">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                        ${profile.tier === 'Nano' ? 'bg-zinc-800 text-zinc-300' :
                                            profile.tier === 'Micro' ? 'bg-blue-900/30 text-blue-400' :
                                                profile.tier === 'Mid' ? 'bg-purple-900/30 text-purple-400' :
                                                    'bg-yellow-900/30 text-yellow-400'}`}>
                                        {profile.tier || 'Nano'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 align-top">{profile.median_views?.toLocaleString()}</td>
                                <td className="px-4 py-4 align-top">{profile.er}%</td>
                                <td className="px-4 py-4 align-top">
                                    <Select value={profile.status} onValueChange={(value) => handleStatusChange(profile.id, value)}>
                                        <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="New">New</SelectItem>
                                            <SelectItem value="Contacted">Contacted</SelectItem>
                                            <SelectItem value="Responding">Responding</SelectItem>
                                            <SelectItem value="Declined">Declined</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="px-4 py-4 align-top text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(profile.id)}
                                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {sortedProfiles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No profiles found. Start scraping Instagram profiles to see them here.
                </div>
            )}
        </div>
    );
}
