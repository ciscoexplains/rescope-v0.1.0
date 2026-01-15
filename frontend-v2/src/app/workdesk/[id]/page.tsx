'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import TikTokCandidatesTable from '@/components/database/TikTokCandidatesTable';

export default function CampaignWorkspace() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    const fetchCampaign = async () => {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();
        if (error) {
            toast.error('Failed to load campaign');
            router.push('/workdesk');
            return;
        }
        setCampaign(data);
    };

    const handleFinish = async () => {
        const { error } = await supabase
            .from('campaigns')
            .update({ status: 'Completed' })
            .eq('id', campaignId);

        if (error) toast.error('Failed to finish campaign');
        else {
            toast.success('Campaign marked as completed');
            router.push('/workdesk');
        }
    };

    if (!campaign) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title={`Workdesk: ${campaign.brand_name}`}>
                <Button variant="outline" onClick={handleFinish} className="gap-2">
                    <CheckCircle size={16} />
                    Finish Task
                </Button>
            </DashboardHeader>

            <div className="rounded-md">
                <TikTokCandidatesTable campaignId={campaignId} />
            </div>
        </div>
    );
}
