'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ClientsPage() {
    const [clients, setClients] = useState([
        { id: 1, name: 'Client A', industry: 'Beauty' },
        { id: 2, name: 'Client B', industry: 'Technology' },
        { id: 3, name: 'Client C', industry: 'Fashion' },
    ]);
    const [newClientName, setNewClientName] = useState('');

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (newClientName.trim()) {
            setClients([...clients, { id: Date.now(), name: newClientName, industry: 'General' }]);
            setNewClientName('');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Client Names</h1>
                <p className="text-gray-500 mt-1">Manage your client database for campaigns.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* List of Clients */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Existing Clients</CardTitle>
                        <CardDescription>List of all registered clients.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {clients.map((client) => (
                                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                    <div>
                                        <p className="font-medium text-[var(--color-text-main)]">{client.name}</p>
                                        <p className="text-xs text-gray-400">{client.industry}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Add New Client Form */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Add New Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <Input
                                label="Client Name"
                                placeholder="Enter client name"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                fullWidth
                            />
                            <Button type="submit" fullWidth disabled={!newClientName.trim()}>
                                <Plus size={18} className="mr-2" />
                                Add Client
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
