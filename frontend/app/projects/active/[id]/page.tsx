'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Save, X, Instagram, ExternalLink, Trash2, CheckCircle, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal'; // Reuse existing Modal
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Define the interface for a KOL record
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
    avg_views: number;
    is_verified: boolean;
    type: string;
    categories: string[];
    grade: string;
    region: string[];
    gender: string;
    age: string; // Range or number
    religion: string;
}

export default function CampaignDetails() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [campaignName, setCampaignName] = useState('Loading...');
    const [data, setData] = useState<KOLRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof KOLRecord | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const tierOrder: Record<string, number> = {
        'Unlisted': 0,
        'Nano': 1,
        'Micro': 2,
        'Mid': 3,
        'Mid/Macro': 3,
        'Macro': 4,
        'Mega': 5,
        'Super': 6
    };

    const handleSort = (key: keyof KOLRecord) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            if (sortConfig.key === 'tier') {
                const aRank = tierOrder[aValue as string] || 0;
                const bRank = tierOrder[bValue as string] || 0;
                if (aRank < bRank) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aRank > bRank) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }

            if (aValue === null) return 1;
            if (bValue === null) return -1;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ isOpen: false, type: 'alert', title: '', message: '' });

    const showAlert = (title: string, message: string) => {
        setModalConfig({ isOpen: true, type: 'alert', title, message });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setModalConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
    };

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleModalConfirm = () => {
        if (modalConfig.onConfirm) modalConfig.onConfirm();
        handleModalClose();
    };

    const handleComplete = async () => {
        showConfirm(
            "Complete Campaign",
            "Are you sure you want to complete this campaign? It will be moved to the Completed Projects list.",
            async () => {
                try {
                    await pb.collection('campaigns').update(id, {
                        status: 'Completed',
                        completed_at: new Date().toISOString()
                    });
                    router.push('/projects/completed');
                } catch (err) {
                    console.error("Failed to complete campaign:", err);
                    showAlert("Error", "Failed to update status.");
                }
            }
        );
    };

    const handleAnalyze = async () => {
        if (data.length === 0) return showAlert("Info", "No candidates to analyze.");

        showConfirm(
            "Start Analysis",
            `Analyze ${data.length} candidates? This will scrape recent videos for detailed metrics (ER, Views, Reach). This may take a minute.`,
            async () => {
                setIsAnalyzing(true);
                try {
                    // Prepare payload
                    const candidates = data.map(d => ({
                        id: d.id,
                        username: d.tiktok || d.instagram || d.kol_name // robust fallback
                    }));

                    const res = await fetch('/api/analyze-campaign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidates })
                    });

                    if (!res.ok) throw new Error('Analysis failed');

                    showAlert("Success", "Analysis Complete! Metrics updated.");
                    fetchCandidates(); // Refresh UI
                } catch (err) {
                    console.error("Analysis Error:", err);
                    showAlert("Error", "An error occurred during analysis details.");
                } finally {
                    setIsAnalyzing(false);
                }
            }
        );
    };

    const fetchCandidates = async () => {
        try {
            // Get Campaign Info
            const campaign = await pb.collection('campaigns').getOne(id, { requestKey: null });
            setCampaignName(campaign.name);

            // Get Candidates (excluding Trashed)
            const records = await pb.collection('candidates').getFullList({
                filter: `campaign="${id}" && status != "Trashed"`,
                requestKey: null
            });

            // Map PB records to interface
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
                avg_views: r.avg_views || 0,
                is_verified: r.is_verified || false,
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
        // Realtime updates
        pb.collection('candidates').subscribe('*', function (e) {
            if (e.record.campaign === id) {
                fetchCandidates();
            }
        });
        return () => { pb.collection('candidates').unsubscribe(); };
    }, [id]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<KOLRecord | null>(null);

    const startEdit = (record: KOLRecord) => {
        setEditingId(record.id);
        setEditForm({ ...record });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEdit = async () => {
        if (editForm && editingId) {
            try {
                // Optimistic Update
                setData(data.map(item => item.id === editingId ? editForm : item));

                // API Call - Set status to 'Reviewed'
                await pb.collection('candidates').update(editingId, {
                    contact: editForm.contact,
                    contact_name: editForm.contact_name,
                    email: editForm.email,
                    type: editForm.type,
                    grade: editForm.grade,
                    region: editForm.region,
                    gender: editForm.gender,
                    age: editForm.age,
                    religion: editForm.religion,
                    status: 'Reviewed'
                });

                setEditingId(null);
                setEditForm(null);
            } catch (err) {
                console.error("Failed to save edit:", err);
                showAlert("Error", "Failed to save changes.");
                fetchCandidates(); // Revert
            }
        }
    };

    const trashCandidate = async (recordId: string) => {
        showConfirm("Remove Candidate", "Are you sure you want to remove this candidate?", async () => {
            try {
                // Optimistic remove
                setData(data.filter(i => i.id !== recordId));

                await pb.collection('candidates').update(recordId, {
                    status: 'Trashed'
                });
            } catch (err) {
                console.error("Failed to trash:", err);
                fetchCandidates();
            }
        });
    };

    const handleExport = () => {
        if (sortedData.length === 0) return showAlert("Info", "No data to export.");

        // Define Headers
        const headers = [
            "KOL ID", "Name", "Contact", "Contact Name", "Email",
            "Instagram", "TikTok", "IG Followers", "TT Followers",
            "Tier", "ER %", "Avg Views", "Verified", "Type",
            "Category", "Grade", "Region", "Gender", "Age", "Religion"
        ];

        // Map Data to Rows
        const rows = sortedData.map(r => [
            r.kol_id,
            `"${r.kol_name.replace(/"/g, '""')}"`, // Escape quotes
            r.contact,
            `"${r.contact_name.replace(/"/g, '""')}"`,
            r.email,
            r.instagram || '',
            r.tiktok || '',
            r.ig_followers,
            r.tt_followers,
            r.tier,
            r.er,
            r.avg_views,
            r.is_verified ? 'Yes' : 'No',
            r.type,
            `"${r.categories.join(', ')}"`,
            r.grade || '',
            `"${r.region.join(', ')}"`,
            r.gender,
            r.age,
            r.religion
        ]);

        // Combine into CSV String
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${campaignName.replace(/\s+/g, '_')}_candidates.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditChange = (field: keyof KOLRecord, value: any) => {
        if (editForm) {
            setEditForm({ ...editForm, [field]: value });
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    if (!id) return <div>Invalid ID</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Campaign: {campaignName}</h1>
                    <p className="text-gray-700 mt-1">Manage and review KOLs for this campaign.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                        <Download size={16} className="mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="outline" onClick={handleComplete} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                        <CheckCircle size={16} className="mr-2" />
                        Finish Campaign
                    </Button>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing || loading}>
                        {isAnalyzing ? (
                            <>Processing...</>
                        ) : (
                            <>Analyze Campaign</>
                        )}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="text-xs text-gray-900 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {/* Table Headers */}
                                    <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 shadow-sm">KOL Name</th>
                                    <th className="px-4 py-3">Info Actions</th>
                                    <th className="px-4 py-3">KOL ID</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Contact Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Platforms</th>
                                    <th className="px-4 py-3">IG Followers</th>
                                    <th className="px-4 py-3">TT Followers</th>
                                    <th
                                        className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none flex items-center gap-1"
                                        onClick={() => handleSort('tier')}
                                    >
                                        Tier
                                        {sortConfig.key === 'tier' && (
                                            <span className="text-gray-500 text-[10px] ml-1">
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </th>
                                    <th className="px-4 py-3">ER %</th>
                                    <th className="px-4 py-3">Avg. Views</th>
                                    <th className="px-4 py-3">Verified</th>
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
                                {sortedData.map((record) => {
                                    const isEditing = editingId === record.id;
                                    const display = isEditing && editForm ? editForm : record;

                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50 text-gray-900">
                                            {/* Frozen Column: Identification */}
                                            <td className="px-4 py-3 sticky left-0 bg-white z-10 shadow-sm border-r border-gray-100 font-bold text-gray-900">
                                                {display.kol_name}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 w-24">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                                                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => startEdit(record)} className="p-1 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button onClick={() => trashCandidate(record.id)} className="p-1 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors" title="Remove">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            {/* KOL ID */}
                                            <td className="px-4 py-3 text-gray-900 font-medium">{display.kol_id}</td>

                                            {/* Contact */}
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <input
                                                        className="w-32 border rounded px-2 py-1 text-xs"
                                                        value={display.contact}
                                                        onChange={(e) => handleEditChange('contact', e.target.value)}
                                                    />
                                                ) : (
                                                    <span className={display.contact === 'None' ? 'text-gray-600 italic' : 'text-gray-900 font-medium'}>{display.contact}</span>
                                                )}
                                            </td>

                                            {/* Contact Name */}
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <input
                                                        className="w-24 border rounded px-2 py-1 text-xs"
                                                        value={display.contact_name}
                                                        onChange={(e) => handleEditChange('contact_name', e.target.value)}
                                                    />
                                                ) : display.contact_name}
                                            </td>

                                            {/* Email */}
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <input
                                                        className="w-32 border rounded px-2 py-1 text-xs"
                                                        value={display.email}
                                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                                    />
                                                ) : (
                                                    <span className={display.email === 'None' ? 'text-gray-600 italic' : 'text-gray-900 font-medium'}>{display.email}</span>
                                                )}
                                            </td>

                                            {/* Platforms */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {display.instagram && (
                                                        <a href={`https://instagram.com/${display.instagram}`} target="_blank" className="text-pink-600 hover:opacity-80">
                                                            <Instagram size={16} />
                                                        </a>
                                                    )}
                                                    {display.tiktok && (
                                                        <a href={`https://tiktok.com/@${display.tiktok}`} target="_blank" className="text-black hover:opacity-80">
                                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" /></svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Followers */}
                                            <td className="px-4 py-3 text-right">{formatNumber(display.ig_followers)}</td>
                                            <td className="px-4 py-3 text-right">{formatNumber(display.tt_followers)}</td>

                                            {/* Tier */}
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const tierColors: Record<string, string> = {
                                                        'Nano': 'bg-gray-100 text-gray-800',
                                                        'Micro': 'bg-blue-100 text-blue-800',
                                                        'Mid': 'bg-purple-100 text-purple-800',
                                                        'Macro': 'bg-pink-100 text-pink-800',
                                                        'Mega': 'bg-orange-100 text-orange-800',
                                                        'Super': 'bg-yellow-100 text-yellow-800',
                                                        'Unlisted': 'bg-gray-200 text-gray-600',
                                                    };
                                                    // Normalize tier name for matching (e.g. "Mid/Macro" -> "Mid")
                                                    const tierKey = Object.keys(tierColors).find(k => display.tier.includes(k)) || 'Nano';
                                                    const colorClass = tierColors[tierKey] || tierColors['Nano'];

                                                    return (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
                                                            {display.tier}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Metrics */}
                                            <td className="px-4 py-3 text-right font-medium text-green-600">{display.er}%</td>
                                            <td className="px-4 py-3 text-right text-blue-600">{formatNumber(display.avg_views)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {display.is_verified ? (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full">
                                                        <CheckCircle size={12} fill="currentColor" />
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <select
                                                        className="w-28 border rounded px-1 py-1 text-xs bg-white"
                                                        value={display.type}
                                                        onChange={(e) => handleEditChange('type', e.target.value)}
                                                    >
                                                        <option value="Influencer">Influencer</option>
                                                        <option value="Aggregator">Aggregator</option>
                                                        <option value="Local Buzzer">Local Buzzer</option>
                                                    </select>
                                                ) : display.type}
                                            </td>

                                            {/* Categories */}
                                            <td className="px-4 py-3 text-gray-900 max-w-[150px] truncate" title={display.categories.join(', ')}>
                                                {display.categories.join(', ')}
                                            </td>

                                            {/* Grade */}
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <select
                                                        className="w-24 border rounded px-1 py-1 text-xs bg-white"
                                                        value={display.grade}
                                                        onChange={(e) => handleEditChange('grade', e.target.value)}
                                                    >
                                                        <option value="None">None</option>
                                                        <option value="High-end">High-end</option>
                                                        <option value="Middle-end">Middle-end</option>
                                                        <option value="Lower-end">Lower-end</option>
                                                    </select>
                                                ) : (
                                                    <span className={display.grade === 'None' || !display.grade ? 'text-gray-400 italic' : ''}>
                                                        {display.grade || 'None'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Region */}
                                            <td className="px-4 py-3 max-w-[150px]">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full border rounded px-1 py-1 text-xs"
                                                        value={display.region.join(', ')}
                                                        onChange={(e) => handleEditChange('region', e.target.value.split(',').map(s => s.trim()))}
                                                        placeholder="e.g. Jakarta, Bali"
                                                    />
                                                ) : (
                                                    <div className="truncate" title={display.region.join(', ')}>
                                                        {display.region.join(', ')}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Demographics */}
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <select
                                                        className="w-20 border rounded px-1 py-1 text-xs bg-white"
                                                        value={display.gender}
                                                        onChange={(e) => handleEditChange('gender', e.target.value)}
                                                    >
                                                        <option value="Unknown">Unknown</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                    </select>
                                                ) : display.gender}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <input
                                                        className="w-16 border rounded px-1 py-1 text-xs"
                                                        value={display.age}
                                                        onChange={(e) => handleEditChange('age', e.target.value)}
                                                    />
                                                ) : display.age}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <input
                                                        className="w-20 border rounded px-1 py-1 text-xs"
                                                        value={display.religion}
                                                        onChange={(e) => handleEditChange('religion', e.target.value)}
                                                    />
                                                ) : display.religion}
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={handleModalClose}
                title={modalConfig.title}
            >
                <div className="space-y-4">
                    <p className="text-gray-700">{modalConfig.message}</p>
                    <div className="flex justify-end gap-2">
                        {modalConfig.type === 'confirm' && (
                            <Button variant="danger-outline" onClick={handleModalClose}>
                                Cancel
                            </Button>
                        )}
                        <Button onClick={handleModalConfirm}>
                            {modalConfig.type === 'confirm' ? 'Confirm' : 'OK'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
