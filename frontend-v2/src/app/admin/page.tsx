'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2 } from "lucide-react";
import { AlertDialog } from '@/components/ui/alert-dialog';
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
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check admin status
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            // Check for @admin.dev domain
            if (user && user.email?.endsWith('@admin.dev')) {
                setIsAdmin(true);
            }
        };
        checkAdmin();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Ignore AbortError if it happens (though Supabase js client relies on fetch mostly internal)
                if (error.message && error.message.includes('AbortError')) return;
                throw error;
            }
            setCampaigns(data || []);
        } catch (error: any) {
            if (error.name === 'AbortError') return; // Handle fetch aborts
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

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteConfirm({ isOpen: true, id, name });
    };

    const handleConfirmDelete = async () => {
        const { id } = deleteConfirm;
        if (!id) return;

        setIsDeleting(true); // Set deleting state to true
        try {
            // Debug: Check if campaign exists
            const { data: checkData, error: checkError } = await supabase
                .from('campaigns')
                .select('id')
                .eq('id', id)
                .single();

            if (checkError || !checkData) {
                console.error("Debug: Campaign not found before delete", checkError);
                throw new Error(`Debug: Campaign not found. Error: ${checkError?.message}`);
            }

            // 1. Manually delete related candidates (simulate cascade)
            const { error: candidatesError, count: candidatesCount } = await supabase
                .from('candidates_tiktok')
                .delete({ count: 'exact' })
                .eq('campaign_id', id);

            console.log(`Debug: Deleted ${candidatesCount} candidates. Error:`, candidatesError);

            if (candidatesError) {
                console.error('Error deleting related candidates:', candidatesError);
                throw new Error(`Failed to clean up candidates: ${candidatesError.message}`);
            }

            // 2. Delete the campaign
            const { error, count } = await supabase
                .from('campaigns')
                .delete({ count: 'exact' })
                .eq('id', id);

            console.log(`Debug: Deleted campaign. Count: ${count}. Error:`, error);

            if (error) throw error;

            if (count === 0) {
                // RLS likely blocked it
                throw new Error(`Deletion count 0. Found: ${!!checkData}. Candidates deleted: ${candidatesCount}. RLS or Policy restriction.`);
            }

            toast.success('Campaign deleted');
            // Optimistic update
            setCampaigns(prev => prev.filter(c => c.id !== id));
            setDeleteConfirm({ isOpen: false, id: '', name: '' }); // Close dialog on success
        } catch (error: any) {
            console.error('Error deleting campaign:', error);
            toast.error(error.message || 'Failed to delete campaign');
            setDeleteConfirm({ isOpen: false, id: '', name: '' }); // Close dialog on error
        } finally {
            setIsDeleting(false); // Reset deleting state
            // Ensure dialog closes even if something unexpected happens, although we handle it in catch/try end usually.
            // But here we want to keep dialog open WHILE deleting to show loading, so we only close on success or error.
            // Actually, in the code above I moved closing to success/error blocks to keep it open during loading.
            // But wait, `finally` runs always.
            // If I want the dialog to stay open showing loading, I should NOT close it until finished.
            // Correct flow:
            // 1. setDeleting(true)
            // 2. await operations
            // 3. success -> close dialog, setDeleting(false)
            // 4. error -> setDeleting(false), maybe keep dialog open or close it? User probably wants to try again or cancel. 
            //    Usually better to keep it open if error is recoverable, but here error might be fatal. 
            //    Let's close it for now on error to be safe as per previous logic.
        }
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
                                    <div className="flex items-center justify-between p-2 bg-muted rounded-md border border-border mb-3">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Code</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono font-bold text-primary">{campaign.join_code}</code>
                                            <button onClick={() => copyCode(campaign.join_code)} className="text-muted-foreground hover:text-foreground">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex justify-end">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => handleDeleteClick(campaign.id, campaign.brand_name)}
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    )}
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

            <AlertDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmDelete}
                title="Delete Campaign"
                description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
                variant="destructive"
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
}
