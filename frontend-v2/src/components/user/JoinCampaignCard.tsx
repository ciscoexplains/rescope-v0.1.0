'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

interface JoinCampaignCardProps {
    onJoinSuccess?: () => void;
}

export default function JoinCampaignCard({ onJoinSuccess }: JoinCampaignCardProps) {
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode) {
            toast.error('Please enter a campaign code');
            return;
        }

        setLoading(true);
        try {
            // 1. Find the campaign
            const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .select('id, brand_name')
                .eq('join_code', joinCode.trim().toUpperCase())
                .single();

            if (campaignError || !campaign) {
                console.error("Campaign lookup error:", campaignError);
                throw new Error('Invalid campaign code');
            }

            // 2. Add user to campaign_members
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: joinError } = await supabase
                .from('campaign_members')
                .insert({
                    campaign_id: campaign.id,
                    user_id: user.id
                });

            if (joinError) {
                if (joinError.code === '23505') { // Unique constraint violation
                    throw new Error('You have already joined this campaign');
                }
                throw joinError;
            }

            toast.success(`Successfully joined ${campaign.brand_name}!`);
            setJoinCode('');
            if (onJoinSuccess) {
                onJoinSuccess();
            }
        } catch (err: any) {
            console.error('Join error:', err);
            toast.error(err.message || 'Failed to join campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Join a Campaign</CardTitle>
                <CardDescription>Enter the code provided by your admin</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleJoin} className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Enter Code (e.g. CP-1234)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="mb-0" // Override margin
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
