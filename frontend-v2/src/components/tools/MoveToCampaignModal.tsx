import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MoveToCampaignModalProps {
    open?: boolean;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
    candidates: any[];
    platform?: 'tiktok' | 'instagram';
    onSuccess: () => void;
}

export function MoveToCampaignModal({ open, isOpen, onOpenChange, onClose, candidates, platform = 'tiktok', onSuccess }: MoveToCampaignModalProps) {
    const modalOpen = open ?? isOpen ?? false;
    const handleClose = (value: boolean) => {
        if (onOpenChange) onOpenChange(value);
        if (onClose && !value) onClose();
    };
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (modalOpen) {
            fetchActiveCampaigns();
        }
    }, [modalOpen]);

    const fetchActiveCampaigns = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch campaigns where the user is a member
            const { data, error } = await supabase
                .from('campaign_members')
                .select(`
                    campaign:campaigns (
                        id,
                        brand_name,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .in('campaign.status', ['Active', 'Draft']);

            if (error) throw error;

            const activeCampaigns = (data as any[])
                .map(item => item.campaign)
                .filter(c => c !== null);

            setCampaigns(activeCampaigns);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async () => {
        if (!selectedCampaignId) return;
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const tableName = platform === 'instagram' ? 'candidates_instagram' : 'candidates_tiktok';
            const inputUsernames = candidates.map(item => item.authorMeta?.name || item.username);

            // Check for existing candidates in this campaign to avoid duplicates
            const { data: existingCandidates, error: fetchError } = await supabase
                .from(tableName)
                .select('username')
                .eq('campaign_id', selectedCampaignId)
                .in('username', inputUsernames);

            if (fetchError) throw fetchError;

            const existingSet = new Set((existingCandidates || []).map(c => c.username));

            const candidatesToInsert = candidates
                .filter(item => {
                    const username = item.authorMeta?.name || item.username;
                    return !existingSet.has(username);
                })
                .map((item: any) => {
                    const commonData = {
                        campaign_id: selectedCampaignId,
                        username: item.authorMeta?.name || item.username || 'unknown',
                        kol_name: item.authorMeta?.nickName || item.authorMeta?.name || item.kol_name || item.full_name || 'Unknown',
                        avg_views: item.avg_views || item.playCount || 0,
                        status: 'New',
                        tier: item.tier || 'Nano',
                        avatar: item.authorMeta?.avatar || item.avatar || '',
                        contact: item.phone || item.contact,
                        email: item.email,
                        er: item.er || 0,
                        profile_url: item.profile_url || (platform === 'instagram'
                            ? `https://www.instagram.com/${item.username}`
                            : `https://tiktok.com/@${item.authorMeta?.name || item.username}`),
                        is_verified: item.is_verified,
                        category: item.category,
                        region: item.region,
                        segment: item.segment || 'Custom',
                        total_likes: item.total_likes || item.authorMeta?.heart || 0
                    };

                    // Add platform-specific fields
                    if (platform === 'tiktok') {
                        return {
                            ...commonData,
                            tiktok: item.authorMeta?.name || item.username || '',
                            tt_followers: item.authorMeta?.fans || item.tt_followers || 0,
                            total_videos: item.total_videos || item.authorMeta?.video || 0
                        };
                    } else {
                        return {
                            ...commonData,
                            followers: item.followers || 0, // Use followers for IG
                            bio: item.bio || '',
                            following: item.following || 0,
                            posts_count: item.posts_count || item.total_videos || 0,
                            median_views: item.median_views || item.avg_views || 0,
                            website: item.website || ''
                        };
                    }
                });

            // Deduplicate candidatesToInsert by username
            const uniqueCandidates = Array.from(new Map(candidatesToInsert.map(item => [item.username, item])).values());

            if (uniqueCandidates.length === 0) {
                toast.info("All selected candidates are already in this campaign.");
                onOpenChange(false);
                setSelectedCampaignId('');
                return;
            }

            console.log("Inserting candidates into", tableName, ":", uniqueCandidates);

            const { error } = await supabase
                .from(tableName)
                .insert(uniqueCandidates);

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw error;
            }

            const skipped = candidates.length - candidatesToInsert.length;
            toast.success(`Successfully moved ${candidatesToInsert.length} candidates.${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`);
            onSuccess();
            handleClose(false);
            setSelectedCampaignId('');

        } catch (error: any) {
            console.error('Error moving candidates (Catch):', error);
            toast.error('Failed to move: ' + (error.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={modalOpen} onClose={() => handleClose(false)} title="Move to Campaign">
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    Select an active campaign to move <strong>{candidates.length}</strong> selected candidates to.
                </p>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                ) : (
                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a campaign" />
                        </SelectTrigger>
                        <SelectContent>
                            {campaigns.length === 0 ? (
                                <SelectItem value="none" disabled>No active campaigns found</SelectItem>
                            ) : (
                                campaigns.map((camp) => (
                                    <SelectItem key={camp.id} value={camp.id}>
                                        {camp.brand_name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleMove} disabled={!selectedCampaignId || saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Move Candidates
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
