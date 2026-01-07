'use client';

import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { Loader2, Save, X, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

    useEffect(() => {
        fetchTrends();

        pb.collection('search_trends').subscribe('*', function (e) {
            if (e.action === 'create') {
                setTrends((prev) => [e.record as unknown as SearchTrend, ...prev]);
            }
            if (e.action === 'update') {
                setTrends((prev) => prev.map((item) => item.id === e.record.id ? e.record as unknown as SearchTrend : item));
            }
            if (e.action === 'delete') {
                setTrends((prev) => prev.filter((item) => item.id !== e.record.id));
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
            alert("Failed to update trend");
        }
    };

    const handleChange = (field: keyof SearchTrend, value: any) => {
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
                                        <button
                                            onClick={() => handleEdit(trend)}
                                            className="p-1 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
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
    );
}
