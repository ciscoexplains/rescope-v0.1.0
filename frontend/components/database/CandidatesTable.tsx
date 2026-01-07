'use client';

import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { Loader2, Save, X, Edit2, Plus, Trash2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';

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

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCleanConfirmOpen, setIsCleanConfirmOpen] = useState(false);
    const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
    const [createForm, setCreateForm] = useState<Partial<Candidate>>({
        kol_name: '',
        username: '',
        tt_followers: 0,
        contact: '-',
        email: '-',
        tier: 'Nano',
        status: 'New',
        er: 0
    });

    useEffect(() => {
        fetchCandidates();

        // Subscribe to real-time updates
        pb.collection('candidates').subscribe('*', function (e) {
            if (e.action === 'create') {
                setCandidates((prev) => [e.record as unknown as Candidate, ...prev]);
                toast.success("New candidate added");
            }
            if (e.action === 'update') {
                setCandidates((prev) => prev.map((item) => item.id === e.record.id ? e.record as unknown as Candidate : item));
                toast.success("Candidate updated");
            }
            if (e.action === 'delete') {
                setCandidates((prev) => prev.filter((item) => item.id !== e.record.id));
                toast.success("Candidate deleted");
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
            toast.error("Failed to load candidates");
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
            toast.error("Failed to update candidate");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this candidate?")) return;
        try {
            await pb.collection('candidates').delete(id);
        } catch (error) {
            console.error("Error deleting candidate:", error);
            toast.error("Failed to delete candidate");
        }
    };

    const handleCleanData = () => {
        const seenUsernames = new Set<string>();
        const duplicates: string[] = [];

        // Identify duplicates (keep the first occurrence, delete subsequent ones)
        candidates.forEach((candidate) => {
            if (!candidate.username) return;

            const normalizedUsername = candidate.username.trim().toLowerCase();
            if (seenUsernames.has(normalizedUsername)) {
                duplicates.push(candidate.id);
            } else {
                seenUsernames.add(normalizedUsername);
            }
        });

        if (duplicates.length === 0) {
            toast.info("No duplicates found.");
            return;
        }

        setDuplicateIds(duplicates);
        setIsCleanConfirmOpen(true);
    };

    const confirmCleanData = async () => {
        setIsCleanConfirmOpen(false);
        toast.info(`Cleaning ${duplicateIds.length} duplicates...`);

        try {
            await Promise.all(duplicateIds.map(id => pb.collection('candidates').delete(id)));
            toast.success(`Successfully removed ${duplicateIds.length} duplicates.`);
            setDuplicateIds([]);
        } catch (error) {
            console.error("Error cleaning data:", error);
            toast.error("Failed to clean some duplicates.");
        }
    };

    const handleCreate = async () => {
        try {
            if (!createForm.kol_name) {
                toast.warning("Name is required");
                return;
            }

            await pb.collection('candidates').create({
                ...createForm,
                // Default values for required fields not in form
                kol_id: `KOL${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
                type: 'Influencer'
            });

            setIsCreateModalOpen(false);
            setCreateForm({
                kol_name: '',
                username: '',
                tt_followers: 0,
                contact: '-',
                email: '-',
                tier: 'Nano',
                status: 'New',
                er: 0
            });
        } catch (error) {
            console.error("Error creating candidate:", error);
            if (error instanceof Error) {
                console.error("Error details:", error.message, error.stack);
            }
            // @ts-ignore
            if (error?.originalError) {
                // @ts-ignore
                console.error("Original error:", error.originalError);
                // @ts-ignore
                if (error?.originalError?.data) {
                    // @ts-ignore
                    console.error("Validation errors:", error.originalError.data);
                }
            }
            toast.error("Failed to create candidate. Check console for details.");
        }
    };

    const handleChange = (field: keyof Candidate, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateChange = (field: keyof Candidate, value: any) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 bg-white border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Candidates List</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleCleanData}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                        title="Remove duplicates based on username"
                    >
                        <Sparkles size={16} />
                        Clean Data
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 transition-opacity text-sm"
                    >
                        <Plus size={16} />
                        Add Candidate
                    </button>
                </div>
            </div>

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
                                                    title="Save"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Cancel"
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
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(candidate)}
                                                    className="p-1 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(candidate.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {candidates.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                    No candidates found in database.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Candidate">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <Input
                            value={createForm.kol_name || ''}
                            onChange={(e) => handleCreateChange('kol_name', e.target.value)}
                            placeholder="KOL Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <Input
                            value={createForm.username || ''}
                            onChange={(e) => handleCreateChange('username', e.target.value)}
                            placeholder="@username"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                            <Input
                                type="number"
                                value={createForm.tt_followers || 0}
                                onChange={(e) => handleCreateChange('tt_followers', Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ER %</label>
                            <Input
                                type="number"
                                value={createForm.er || 0}
                                onChange={(e) => handleCreateChange('er', Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                            <Input
                                value={createForm.contact || ''}
                                onChange={(e) => handleCreateChange('contact', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <Input
                                value={createForm.email || ''}
                                onChange={(e) => handleCreateChange('email', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                            <select
                                value={createForm.tier || 'Nano'}
                                onChange={(e) => handleCreateChange('tier', e.target.value)}
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            >
                                <option value="Nano">Nano</option>
                                <option value="Micro">Micro</option>
                                <option value="Mid/Macro">Mid/Macro</option>
                                <option value="Mega">Mega</option>
                                <option value="Unlisted">Unlisted</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={createForm.status || 'New'}
                                onChange={(e) => handleCreateChange('status', e.target.value)}
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            >
                                <option value="New">New</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Trashed">Trashed</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:opacity-90 rounded-lg"
                        >
                            Create Candidate
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCleanConfirmOpen} onClose={() => setIsCleanConfirmOpen(false)} title="Clean Duplicates">
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                        ⚠️ This action cannot be undone.
                    </div>
                    <p className="text-gray-600">
                        We found <strong>{duplicateIds.length}</strong> duplicate candidates with the same username.
                        Do you want to delete them and keep only the first occurrence?
                    </p>
                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setIsCleanConfirmOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmCleanData}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                        >
                            Delete {duplicateIds.length} Duplicates
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
