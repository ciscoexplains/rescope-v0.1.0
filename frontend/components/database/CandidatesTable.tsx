'use client';

import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { Loader2, Save, X, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Candidate {
    id: string;
    kol_name: string;
    username: string;
    tt_followers: number;
    contact: string;
    email: string;
    tier: string;
    status: string;
    er: number;
}

export default function CandidatesTable() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Candidate>>({});

    useEffect(() => {
        fetchCandidates();

        // Subscribe to real-time updates
        pb.collection('candidates').subscribe('*', function (e) {
            if (e.action === 'create') {
                setCandidates((prev) => [e.record as unknown as Candidate, ...prev]);
            }
            if (e.action === 'update') {
                setCandidates((prev) => prev.map((item) => item.id === e.record.id ? e.record as unknown as Candidate : item));
            }
            if (e.action === 'delete') {
                setCandidates((prev) => prev.filter((item) => item.id !== e.record.id));
            }
        });

        return () => {
            pb.collection('candidates').unsubscribe();
        };
    }, []);

    const fetchCandidates = async () => {
        try {
            const records = await pb.collection('candidates').getFullList({
                requestKey: null
            });
            setCandidates(records as unknown as Candidate[]);
        } catch (error) {
            console.error("Error fetching candidates:", error);
            if (error instanceof Error) {
                console.error("Error details:", error.message, error.stack);
            }
            // @ts-ignore
            if (error?.originalError) {
                // @ts-ignore
                console.error("Original error:", error.originalError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (candidate: Candidate) => {
        setEditingId(candidate.id);
        setEditForm({ ...candidate });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (id: string) => {
        try {
            await pb.collection('candidates').update(id, editForm);
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error("Error updating candidate:", error);
            alert("Failed to update candidate");
        }
    };

    const handleChange = (field: keyof Candidate, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Username</th>
                        <th className="px-6 py-3">Followers</th>
                        <th className="px-6 py-3">Contact</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Tier</th>
                        <th className="px-6 py-3">ER%</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {candidates.map((candidate) => (
                        <tr key={candidate.id} className="bg-white border-b hover:bg-gray-50">
                            {editingId === candidate.id ? (
                                <>
                                    <td className="px-6 py-4">
                                        <Input
                                            value={editForm.kol_name || ''}
                                            onChange={(e) => handleChange('kol_name', e.target.value)}
                                            className="h-8"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Input
                                            value={editForm.username || ''}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                            className="h-8"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Input
                                            type="number"
                                            value={editForm.tt_followers || 0}
                                            onChange={(e) => handleChange('tt_followers', Number(e.target.value))}
                                            className="h-8 w-24"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Input
                                            value={editForm.contact || ''}
                                            onChange={(e) => handleChange('contact', e.target.value)}
                                            className="h-8"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Input
                                            value={editForm.email || ''}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className="h-8"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={editForm.tier || 'Nano'}
                                            onChange={(e) => handleChange('tier', e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-full"
                                        >
                                            <option value="Nano">Nano</option>
                                            <option value="Micro">Micro</option>
                                            <option value="Mid/Macro">Mid/Macro</option>
                                            <option value="Mega">Mega</option>
                                            <option value="Unlisted">Unlisted</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Input
                                            type="number"
                                            value={editForm.er || 0}
                                            onChange={(e) => handleChange('er', Number(e.target.value))}
                                            className="h-8 w-20"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={editForm.status || 'New'}
                                            onChange={(e) => handleChange('status', e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-full"
                                        >
                                            <option value="New">New</option>
                                            <option value="Reviewed">Reviewed</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="Trashed">Trashed</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(candidate.id)}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-4 font-medium text-gray-900">{candidate.kol_name}</td>
                                    <td className="px-6 py-4 text-gray-500">{candidate.username}</td>
                                    <td className="px-6 py-4 text-gray-500">{candidate.tt_followers?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500">{candidate.contact || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500">{candidate.email || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${candidate.tier === 'Nano' ? 'bg-gray-100 text-gray-800' :
                                                candidate.tier === 'Micro' ? 'bg-blue-100 text-blue-800' :
                                                    candidate.tier === 'Mid/Macro' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                            {candidate.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{candidate.er}%</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${candidate.status === 'New' ? 'bg-blue-50 text-blue-600' :
                                                candidate.status === 'Reviewed' ? 'bg-green-50 text-green-600' :
                                                    'bg-gray-50 text-gray-600'}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(candidate)}
                                            className="p-1 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}

                    {candidates.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                No candidates found in database.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
