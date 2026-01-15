'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InstagramCandidate {
    id: string;
    kol_name: string;
    username: string;
    ig_followers: number;
    contact: string;
    email: string;
    tier: string;
    status: string;
    er: number;
}

export default function InstagramCandidatesTable() {
    const [candidates, setCandidates] = useState<InstagramCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCandidates();

        const channel = supabase
            .channel('candidates_instagram_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates_instagram' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setCandidates((prev) => [payload.new as InstagramCandidate, ...prev]);
                    toast.success("New candidate added");
                }
                if (payload.eventType === 'UPDATE') {
                    setCandidates((prev) => prev.map((item) => item.id === payload.new.id ? payload.new as InstagramCandidate : item));
                    toast.success("Candidate updated");
                }
                if (payload.eventType === 'DELETE') {
                    setCandidates((prev) => prev.filter((item) => item.id !== payload.old.id));
                    toast.success("Candidate deleted");
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('candidates_instagram')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) toast.error('Failed to update status');
        else toast.success('Status updated');
    };

    const fetchCandidates = async () => {
        try {
            const { data, error } = await supabase
                .from('candidates_instagram')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidates(data as InstagramCandidate[]);
        } catch (error: any) {
            console.error("Error fetching candidates:", error);
            toast.error("Failed to load candidates");
        } finally {
            setLoading(false);
        }
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
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" size={18} />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Instagram candidates..."
                        containerClassName="mb-0"
                        className="pl-10 h-10 w-full bg-secondary/30 border-secondary-foreground/10 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-xl hover:bg-secondary/50"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 text-white rounded-md hover:opacity-90 transition-opacity text-sm">
                        <Plus size={16} />
                        Add Candidate
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-foreground">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                        <tr>
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
                                <td className="px-6 py-4 font-medium text-foreground">{candidate.kol_name}</td>
                                <td className="px-6 py-4 text-muted-foreground">{candidate.username}</td>
                                <td className="px-6 py-4 text-muted-foreground">{candidate.ig_followers?.toLocaleString()}</td>
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
                                    <Select
                                        value={candidate.status}
                                        onValueChange={(value) => updateStatus(candidate.id, value)}
                                    >
                                        <SelectTrigger className={`h-7 w-[100px] border-none bg-transparent text-xs font-medium focus:ring-0 focus:ring-offset-0 px-2
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
                                <td className="px-6 py-4 text-right">
                                    <span className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">...</span>
                                </td>
                            </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
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
