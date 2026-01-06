'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Play, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

interface Campaign {
    id: string;
    name: string;
    status: string;
    client_name: string;
    updated: string;
    completed_at?: string;
}

export default function CompletedProjects() {
    const [projects, setProjects] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Completed Campaigns
    const fetchCampaigns = async () => {
        try {
            const records = await pb.collection('campaigns').getFullList({
                filter: 'status = "Completed"',
                requestKey: null
            });
            setProjects(records.map((r: any) => ({
                id: r.id,
                name: r.name,
                status: r.status,
                client_name: r.client_name,
                updated: r.updated,
                completed_at: r.completed_at
            })));
        } catch (err) {
            console.error("Error fetching campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();

        // Realtime subscription (update if a campaign is completed elsewhere)
        pb.collection('campaigns').subscribe('*', function (e) {
            if (e.record.status === 'Completed' || (e.action === 'update' && e.record.status === 'Completed')) {
                fetchCampaigns();
            }
        });

        return () => {
            pb.collection('campaigns').unsubscribe();
        };
    }, []);

    const deleteCampaign = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this campaign history?')) {
            await pb.collection('campaigns').delete(id);
            fetchCampaigns();
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading history...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Completed Campaigns</h1>
                    <p className="text-gray-500 mt-1">History of your finished influencer campaigns.</p>
                </div>

                <Button variant="outline" size="sm" onClick={fetchCampaigns}>
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Campaign ID</th>
                                    <th className="px-6 py-3">Campaign Name</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Client Name</th>
                                    <th className="px-6 py-3">Completed Date</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No completed campaigns found.
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map((project) => (
                                        <tr key={project.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{project.id}</td>
                                            <td className="px-6 py-4">
                                                <Link href={`/projects/completed/${project.id}`} className="text-[var(--color-primary)] font-medium hover:underline">
                                                    {project.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle size={14} className="mr-1" />
                                                    Completed
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{project.client_name}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {new Date(project.completed_at || project.updated).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={(e) => deleteCampaign(project.id, e)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
