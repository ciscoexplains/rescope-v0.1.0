'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import JoinCampaignCard from "@/components/user/JoinCampaignCard";
import { Briefcase } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface JoinedCampaign {
  id: string; // membership id
  joined_at: string;
  campaign: {
    id: string;
    brand_name: string;
    status: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [joinedCampaigns, setJoinedCampaigns] = useState<JoinedCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJoinedCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('campaign_members')
        .select(`
                    id,
                    joined_at,
                    campaign:campaigns (
                        id,
                        brand_name,
                        status
                    )
                `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      // Type casting because supabase join returns object or array dep on relation
      setJoinedCampaigns((data as any) || []);
    } catch (error) {
      console.error('Error fetching joined campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinedCampaigns();
  }, []);

  // Listen to inserts specifically? Or just pass a refresh function to JoinCard?
  // For now simple.

  return (
    <div className="p-6 space-y-8">
      <DashboardHeader title="Your Workdesk" />

      {/* Action Section */}
      <div className="max-w-xl">
        <JoinCampaignCard onJoinSuccess={(data) => {
          if (data?.campaign?.id) {
            router.push(`/workdesk/${data.campaign.id}`);
          } else {
            fetchJoinedCampaigns();
          }
        }} />
      </div>

      {/* Campaigns Grid */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Active Campaigns
        </h2>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : joinedCampaigns.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-dashed border-2 bg-transparent shadow-none flex items-center justify-center p-8 h-[200px]">
              <div className="text-center text-muted-foreground">
                <p>No active campaigns found.</p>
                <p className="text-sm mt-1">Join one using a code above.</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {joinedCampaigns.map((item) => (
              <Link key={item.id} href={`/workdesk/${item.campaign.id}`}>
                <Card className="hover:bg-accent/5 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {item.campaign.brand_name}
                      </CardTitle>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        {item.campaign.status}
                      </span>
                    </div>
                    <CardDescription>
                      Joined {new Date(item.joined_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Click to enter workdesk
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
