'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Instagram, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

interface KOLRecord {
    id: string; // PB Record ID
    kol_id: string;
    kol_name: string;
    contact: string;
    contact_name: string;
    email: string;
    instagram: string | null;
    tiktok: string | null;
    ig_followers: number;
    tt_followers: number;
    tier: string;
    er: number;
    genuine_rate: number;
    match_score: number;
    type: string;
    categories: string[];
    grade: string;
    region: string[];
    gender: string;
    age: string;
    religion: string;
}

export default function CompletedCampaignDetails() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [campaignName, setCampaignName] = useState('Loading...');
    const [data, setData] = useState<KOLRecord[]>([]);

    const fetchCandidates = async () => {
        try {
            const campaign = await pb.collection('campaigns').getOne(id, { requestKey: null });
            setCampaignName(campaign.name);

            const records = await pb.collection('candidates').getFullList({
                filter: `campaign="${id}" && status != "Trashed"`, // Show only final list
                requestKey: null
            });

            setData(records.map((r: any) => ({
                id: r.id,
                kol_id: r.kol_id,
                kol_name: r.kol_name,
                contact: r.contact,
                contact_name: r.contact_name,
                email: r.email,
                instagram: r.instagram,
                tiktok: r.tiktok,
                ig_followers: r.ig_followers,
                tt_followers: r.tt_followers,
                tier: r.tier,
                er: r.er,
                genuine_rate: r.genuine_rate,
                match_score: r.match_score,
                type: r.type,
                categories: r.categories || [],
                grade: r.grade,
                region: r.region || [],
                gender: r.gender,
                age: r.age,
                religion: r.religion
            })));
        } catch (err) {
            console.error("Failed to fetch details:", err);
            setCampaignName('Error loading campaign');
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, [id]);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    if (!id) return <div>Invalid ID</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-bold">Completed</span>
                        <h1 className="text-3xl font-bold text-[var(--color-text-main)]">{campaignName}</h1>
                    </div>
                    <p className="text-gray-500">Final list of influencers for this campaign.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/projects/completed')}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back to History
                    </Button>
                    <Button>Export Report</Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="text-xs text-gray-900 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 shadow-sm">KOL Name</th>
                                    <th className="px-4 py-3">KOL ID</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Contact Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Platforms</th>
                                    <th className="px-4 py-3">IG Followers</th>
                                    <th className="px-4 py-3">TT Followers</th>
                                    <th className="px-4 py-3">Tier</th>
                                    <th className="px-4 py-3">ER %</th>
                                    <th className="px-4 py-3">G.F. Rate %</th>
                                    <th className="px-4 py-3">Match %</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Grade</th>
                                    <th className="px-4 py-3">Region</th>
                                    <th className="px-4 py-3">Gender</th>
                                    <th className="px-4 py-3">Age</th>
                                    <th className="px-4 py-3">Religion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 text-gray-900">
                                        <td className="px-4 py-3 sticky left-0 bg-white z-10 shadow-sm border-r border-gray-100 font-medium text-gray-900">
                                            {record.kol_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{record.kol_id}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{record.contact}</td>
                                        <td className="px-4 py-3">{record.contact_name}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{record.email}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {record.instagram && (
                                                    <a href={`https://instagram.com/${record.instagram}`} target="_blank" className="text-pink-600 hover:opacity-80">
                                                        <Instagram size={16} />
                                                    </a>
                                                )}
                                                {record.tiktok && (
                                                    <a href={`https://tiktok.com/@${record.tiktok}`} target="_blank" className="text-black hover:opacity-80">
                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" /></svg>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">{formatNumber(record.ig_followers)}</td>
                                        <td className="px-4 py-3 text-right">{formatNumber(record.tt_followers)}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">{record.tier}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-green-600">{record.er}%</td>
                                        <td className="px-4 py-3 text-right text-blue-600">{record.genuine_rate}%</td>
                                        <td className="px-4 py-3 text-right font-bold text-purple-600">{record.match_score}%</td>
                                        <td className="px-4 py-3">{record.type}</td>
                                        <td className="px-4 py-3 max-w-[150px] truncate" title={record.categories.join(', ')}>{record.categories.join(', ')}</td>
                                        <td className="px-4 py-3">{record.grade}</td>
                                        <td className="px-4 py-3 max-w-[150px] truncate" title={record.region.join(', ')}>{record.region.join(', ')}</td>
                                        <td className="px-4 py-3">{record.gender}</td>
                                        <td className="px-4 py-3">{record.age}</td>
                                        <td className="px-4 py-3">{record.religion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
