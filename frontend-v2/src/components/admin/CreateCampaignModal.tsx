'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
    const [loading, setLoading] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');

    const generateCode = () => {
        // Generate a random 6-character code (A-Z, 0-9)
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandName) {
            toast.error('Brand Name is required');
            return;
        }

        setLoading(true);
        const joinCode = generateCode();

        try {
            const { error } = await supabase
                .from('campaigns')
                .insert({
                    brand_name: brandName,
                    description: brandDescription,
                    join_code: joinCode,
                    status: 'Active'
                });

            if (error) throw error;

            toast.success('Campaign created successfully');
            setGeneratedCode(joinCode);
            setBrandName('');
            setBrandDescription('');
            onSuccess?.();
            // Don't close immediately so they can see the code
        } catch (err: any) {
            console.error('Error creating campaign:', err);
            toast.error(err.message || 'Failed to create campaign');
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        toast.success('Code copied to clipboard');
    };

    const handleClose = () => {
        setGeneratedCode('');
        setLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Campaign">
            {generatedCode ? (
                <div className="space-y-6 text-center py-4">
                    <div className="space-y-2">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Campaign Created!</h3>
                        <p className="text-muted-foreground">Share this code with users to let them join.</p>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border border-border">
                        <code className="flex-1 text-2xl font-mono font-bold tracking-wider text-primary">
                            {generatedCode}
                        </code>
                        <Button size="sm" variant="ghost" onClick={handleCopyCode}>
                            <Copy size={18} />
                        </Button>
                    </div>

                    <Button className="w-full" onClick={handleClose}>
                        Done
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Brand Name"
                        placeholder="e.g. Acme Corp"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        fullWidth
                        required
                    />

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">
                            Description
                        </label>
                        <textarea
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Campaign details and objectives..."
                            value={brandDescription}
                            onChange={(e) => setBrandDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
