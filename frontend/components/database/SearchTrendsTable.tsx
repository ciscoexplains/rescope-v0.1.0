'use client';

import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { Loader2, Save, X, Edit2, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';

interface SearchTrend {
    id: string;
    main_category: string;
    sub_category: string;
    queries: string[];
}

export default function SearchTrendsTable() {
    const [trends, setTrends] = useState<SearchTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SearchTrend>>({});
    const [queriesText, setQueriesText] = useState('');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<Partial<SearchTrend>>({
        main_category: '',
        sub_category: '',
        queries: []
    });
    const [createQueriesText, setCreateQueriesText] = useState('');

    useEffect(() => {
        fetchTrends();

        pb.collection('search_trends').subscribe('*', function (e) {
            if (e.action === 'create') {
                setTrends((prev) => [e.record as unknown as SearchTrend, ...prev]);
                toast.success("New trend added");
            }
            if (e.action === 'update') {
                setTrends((prev) => prev.map((item) => item.id === e.record.id ? e.record as unknown as SearchTrend : item));
                toast.success("Trend updated");
            }
            if (e.action === 'delete') {
                setTrends((prev) => prev.filter((item) => item.id !== e.record.id));
                toast.success("Trend deleted");
            }
        });

        return () => {
            pb.collection('search_trends').unsubscribe();
        };
    }, []);

    const fetchTrends = async () => {
        try {
            const records = await pb.collection('search_trends').getFullList({
                sort: 'main_category',
                requestKey: null
            });
            setTrends(records as unknown as SearchTrend[]);
        } catch (error) {
            console.error("Error fetching search trends:", error);
            toast.error("Failed to load search trends");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (trend: SearchTrend) => {
        setEditingId(trend.id);
        const q = trend.queries || [];
        setEditForm({ ...trend });
        setQueriesText(Array.isArray(q) ? q.join(', ') : '');
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
        setQueriesText('');
    };

    const handleSave = async (id: string) => {
        try {
            // Parse queries
            const queriesArray = queriesText.split(',').map(s => s.trim()).filter(Boolean);

            await pb.collection('search_trends').update(id, {
                ...editForm,
                queries: queriesArray
            });

            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error("Error updating trend:", error);
            toast.error("Failed to update trend");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this trend?")) return;
        try {
            await pb.collection('search_trends').delete(id);
        } catch (error) {
            console.error("Error deleting trend:", error);
            toast.error("Failed to delete trend");
        }
    };

    const handleCreate = async () => {
        try {
            if (!createForm.main_category) {
                toast.warning("Main category is required");
                return;
            }
            if (!createForm.sub_category) {
                toast.warning("Sub category is required");
                return;
            }

            const queriesArray = createQueriesText.split(',').map(s => s.trim()).filter(Boolean);

            await pb.collection('search_trends').create({
                ...createForm,
                queries: queriesArray
            });

            setIsCreateModalOpen(false);
            setCreateForm({
                main_category: '',
                sub_category: '',
                queries: []
            });
            setCreateQueriesText('');
        } catch (error) {
            console.error("Error creating trend:", error);
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
            toast.error("Failed to create trend. See console for details.");
        }
    };

    const handleChange = (field: keyof SearchTrend, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateChange = (field: keyof SearchTrend, value: any) => {
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
                <h3 className="font-medium text-gray-900">Search Trends List</h3>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 transition-opacity text-sm"
                >
                    <Plus size={16} />
                    Add Trend
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3">Main Category</th>
                            <th className="px-6 py-3">Sub Category</th>
                            <th className="px-6 py-3">Queries (Comma Separated)</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trends.map((trend) => (
                            <tr key={trend.id} className="bg-white border-b hover:bg-gray-50">
                                {editingId === trend.id ? (
                                    <>
                                        <td className="px-6 py-4">
                                            <Input
                                                value={editForm.main_category || ''}
                                                onChange={(e) => handleChange('main_category', e.target.value)}
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Input
                                                value={editForm.sub_category || ''}
                                                onChange={(e) => handleChange('sub_category', e.target.value)}
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Input
                                                value={queriesText}
                                                onChange={(e) => setQueriesText(e.target.value)}
                                                className="h-8 w-full"
                                                placeholder="query1, query2..."
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleSave(trend.id)}
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
                                        <td className="px-6 py-4 font-medium text-gray-900">{trend.main_category}</td>
                                        <td className="px-6 py-4 text-gray-500">{trend.sub_category}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex flex-wrap gap-1">
                                                {trend.queries && Array.isArray(trend.queries) && trend.queries.map((q, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{q}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(trend)}
                                                    className="p-1 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trend.id)}
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

                        {trends.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No search trends found in database.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Search Trend">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
                        <Input
                            value={createForm.main_category || ''}
                            onChange={(e) => handleCreateChange('main_category', e.target.value)}
                            placeholder="e.g. Fashion"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                        <Input
                            value={createForm.sub_category || ''}
                            onChange={(e) => handleCreateChange('sub_category', e.target.value)}
                            placeholder="e.g. Accessories"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Queries (comma separated)</label>
                        <textarea
                            value={createQueriesText}
                            onChange={(e) => setCreateQueriesText(e.target.value)}
                            className="w-full h-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none"
                            placeholder="query1, query2, query3..."
                        />
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
                            Create Trend
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
