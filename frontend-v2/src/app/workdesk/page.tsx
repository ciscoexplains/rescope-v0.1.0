'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { Briefcase, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import JoinCampaignCard from "@/components/user/JoinCampaignCard";

interface JoinedCampaign {
    id: string; // membership id
    campaign: {
        id: string;
        brand_name: string;
        status: string;
    };
}

export default function WorkdeskPage() {
    const [joinedCampaigns, setJoinedCampaigns] = useState<JoinedCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJoinedCampaigns();
    }, []);

    const fetchJoinedCampaigns = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('campaign_members')
                .select(`
                    id,
                    campaign:campaigns (
                        id,
                        brand_name,
                        status
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            setJoinedCampaigns((data as any) || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="My Workdesk" />

            <div className="max-w-xl">
                <JoinCampaignCard onJoinSuccess={fetchJoinedCampaigns} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {joinedCampaigns.map((item) => (
                    <Link href={`/workdesk/${item.campaign.id}`} key={item.id}>
                        <Card className="hover:bg-accent/5 transition-all hover:scale-[1.02] cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle>{item.campaign.brand_name}</CardTitle>
                                <CardDescription>Status: {item.campaign.status}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-primary font-medium text-sm">
                                    Open Workspace <ArrowRight size={16} className="ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {joinedCampaigns.length === 0 && !loading && (
                    <p className="text-muted-foreground col-span-full">
                        You haven't joined any campaigns yet. Use a code to join one.
                    </p>
                )}
            </div>
        </div>
    );
}
