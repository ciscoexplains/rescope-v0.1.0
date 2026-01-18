'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MassEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: Set<string>;
    platform: 'instagram' | 'tiktok';
    onComplete: () => void;
}

export default function MassEditDialog({ isOpen, onClose, selectedIds, platform, onComplete }: MassEditDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fieldToUpdate, setFieldToUpdate] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');

    const handleSave = async () => {
        if (!fieldToUpdate) {
            toast.error('Please select a field to update');
            return;
        }

        setLoading(true);
        try {
            const table = platform === 'instagram' ? 'candidates_instagram' : 'candidates_tiktok';
            const ids = Array.from(selectedIds);

            // Construct update object based on type
            let updateValue: any = newValue;

            // Handle numeric fields if needed (currently most bulk edits are text/select)

            const { error } = await supabase
                .from(table)
                .update({ [fieldToUpdate]: updateValue })
                .in('id', ids);

            if (error) throw error;

            toast.success(`Updated ${ids.length} candidates`);
            onComplete();
            onClose();
            // Reset form
            setFieldToUpdate('');
            setNewValue('');
        } catch (error: any) {
            console.error('Error mass updating:', error);
            toast.error('Failed to update candidates');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mass Edit Candidates</DialogTitle>
                    <DialogDescription>
                        Update {selectedIds.size} selected candidates.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="field">Field to Update</Label>
                        <Select value={fieldToUpdate} onValueChange={setFieldToUpdate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="tier">Tier</SelectItem>
                                <SelectItem value="category">Category</SelectItem>
                                <SelectItem value="region">Region</SelectItem>
                                <SelectItem value="segment">Segment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {fieldToUpdate && (
                        <div className="space-y-2">
                            <Label htmlFor="value">New Value</Label>
                            {fieldToUpdate === 'status' ? (
                                <Select value={newValue} onValueChange={setNewValue}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select new status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="New">New</SelectItem>
                                        <SelectItem value="Contacted">Contacted</SelectItem>
                                        <SelectItem value="Responding">Responding</SelectItem>
                                        <SelectItem value="Declined">Declined</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Trashed">Trashed</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : fieldToUpdate === 'tier' ? (
                                <Select value={newValue} onValueChange={setNewValue}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select new tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Nano">Nano</SelectItem>
                                        <SelectItem value="Micro">Micro</SelectItem>
                                        <SelectItem value="Mid/Macro">Mid/Macro</SelectItem>
                                        <SelectItem value="Macro">Macro</SelectItem>
                                        <SelectItem value="Mega">Mega</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="value"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder={`Enter new ${fieldToUpdate}`}
                                />
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading || !fieldToUpdate}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
