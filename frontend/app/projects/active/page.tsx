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
}

export default function ActiveProjects() {
    const [projects, setProjects] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Campaigns
    const fetchCampaigns = async () => {
        try {
            const records = await pb.collection('campaigns').getFullList({
                filter: 'status != "Completed"',
                requestKey: null
            });
            setProjects(records.map((r: any) => ({
                id: r.id,
                name: r.name,
                status: r.status,
                client_name: r.client_name,
                updated: r.updated
            })));
        } catch (err) {
            console.error("Error fetching campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();

        // Realtime subscription
        pb.collection('campaigns').subscribe('*', function (e) {
            fetchCampaigns();
        });

        return () => {
            pb.collection('campaigns').unsubscribe();
        };
    }, []);

    const deleteCampaign = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this campaign?')) {
            await pb.collection('campaigns').delete(id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Loading': return 'bg-yellow-100 text-yellow-800';
            case 'Ongoing': return 'bg-blue-100 text-blue-800';
            case 'Analyzing': return 'bg-purple-100 text-purple-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Loading': return <RefreshCw size={14} className="animate-spin mr-1" />;
            case 'Ongoing': return <Play size={14} className="mr-1" />;
            case 'Failed': return <AlertCircle size={14} className="mr-1" />;
            case 'Completed': return <CheckCircle size={14} className="mr-1" />;
            default: return null;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading campaigns...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Active Campaigns</h1>
                    <p className="text-gray-500 mt-1">Manage your ongoing influencer campaigns.</p>
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
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No campaigns found. Create one from the Dashboard.
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map((project) => (
                                        <tr key={project.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{project.id}</td>
                                            <td className="px-6 py-4">
                                                {project.status === 'Ongoing' || project.status === 'Completed' ? (
                                                    <Link href={`/projects/active/${project.id}`} className="text-[var(--color-primary)] font-medium hover:underline">
                                                        {project.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-500">{project.name}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                    {getStatusIcon(project.status)}
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{project.client_name}</td>
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
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                        <span>Showing {projects.length} results</span>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
