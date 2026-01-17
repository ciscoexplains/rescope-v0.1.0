'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InstagramCandidatesTable from '@/components/database/InstagramCandidatesTable';
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
        // Check for unreviewed candidates in TikTok
        const { count: ttCount, error: ttError } = await supabase
            .from('candidates_tiktok')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('status', 'New');

        if (ttError) {
            console.error("Error checking TikTok candidates status:", ttError);
            toast.error("Failed to verify campaign status");
            return;
        }

        // Check for unreviewed candidates in Instagram
        const { count: igCount, error: igError } = await supabase
            .from('candidates_instagram')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('status', 'New');

        if (igError) {
            console.error("Error checking Instagram candidates status:", igError);
            toast.error("Failed to verify campaign status");
            return;
        }

        const totalUnreviewed = (ttCount || 0) + (igCount || 0);

        if (totalUnreviewed > 0) {
            toast.error(`Cannot finish task. There are ${totalUnreviewed} unreviewed candidates.`);
            return;
        }

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
            <DashboardHeader
                customGreeting={`Workdesk: ${campaign.brand_name}`}
                title={campaign.description}
            >
                <Button variant="outline" onClick={handleFinish} className="gap-2">
                    <CheckCircle size={16} />
                    Finish Task
                </Button>
            </DashboardHeader>

            <div className="rounded-md">
                <Tabs defaultValue="tiktok" className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 mb-4">
                        <TabsTrigger value="tiktok" className="data-[state=active]:bg-zinc-800">
                            TikTok Candidates
                        </TabsTrigger>
                        <TabsTrigger value="instagram" className="data-[state=active]:bg-zinc-800">
                            Instagram Candidates
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="tiktok">
                        <TikTokCandidatesTable campaignId={campaignId} />
                    </TabsContent>
                    <TabsContent value="instagram">
                        <InstagramCandidatesTable campaignId={campaignId} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
