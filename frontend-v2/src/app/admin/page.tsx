'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import CreateCampaignModal from "@/components/admin/CreateCampaignModal";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Campaign {
    id: string;
    brand_name: string;
    join_code: string;
    status: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            // toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Code copied");
    };

    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="System Overview & Controls">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                </Button>
            </DashboardHeader>

            {/* Campaigns List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground">All Campaigns</h2>

                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                    <Card className="border-dashed bg-transparent shadow-none">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-muted-foreground mb-4">No campaigns created yet.</p>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                                Create your first campaign
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map((campaign) => (
                            <Card key={campaign.id} className="bg-card hover:bg-accent/5 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Link href={`/workdesk/${campaign.id}`} className="hover:underline">
                                            <CardTitle className="font-bold text-lg">{campaign.brand_name}</CardTitle>
                                        </Link>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${campaign.status === 'Active'
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-muted text-muted-foreground border-border'
                                            }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Created on {new Date(campaign.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-2 bg-muted rounded-md border border-border">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Code</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono font-bold text-primary">{campaign.join_code}</code>
                                            <button onClick={() => copyCode(campaign.join_code)} className="text-muted-foreground hover:text-foreground">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchCampaigns}
            />
        </div>
    );
}
