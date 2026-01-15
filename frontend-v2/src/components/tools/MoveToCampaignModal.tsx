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
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidates: any[];
    onSuccess: () => void;
}

export function MoveToCampaignModal({ open, onOpenChange, candidates, onSuccess }: MoveToCampaignModalProps) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            fetchActiveCampaigns();
        }
    }, [open]);

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

            const candidatesToInsert = candidates.map((item: any) => ({
                campaign_id: selectedCampaignId,
                username: item.authorMeta?.name || 'unknown',
                kol_name: item.authorMeta?.nickName || item.authorMeta?.name || 'Unknown',
                tt_followers: item.authorMeta?.fans || 0,
                avg_views: item.avg_views || item.playCount || 0,
                status: 'New',
                tier: item.tier || 'Nano',
                tiktok: item.authorMeta?.name || '',
                avatar: item.authorMeta?.avatar || '',
                contact: item.phone,
                email: item.email,
                er: item.er || 0,
                profile_url: `https://tiktok.com/@${item.authorMeta?.name}`,
                is_verified: item.is_verified,
                category: item.category,
                region: item.region,
                segment: item.segment,
                total_likes: item.total_likes || item.authorMeta?.heart || 0,
                total_videos: item.total_videos || item.authorMeta?.video || 0
            }));

            const { error } = await supabase
                .from('candidates_tiktok')
                .insert(candidatesToInsert);

            if (error) throw error;

            toast.success(`Successfully moved ${candidatesToInsert.length} candidates.`);
            onSuccess();
            onOpenChange(false);
            setSelectedCampaignId('');

        } catch (error: any) {
            console.error('Error moving candidates:', error);
            toast.error('Failed to move candidates');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Move to Campaign">
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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
