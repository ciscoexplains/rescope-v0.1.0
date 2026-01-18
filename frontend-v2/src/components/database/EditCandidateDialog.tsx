'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { KOL_CATEGORIES } from '@/constants/categories';
import { KOL_REGIONS } from '@/constants/regions';

interface EditCandidateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any;
    platform: 'instagram' | 'tiktok';
    onSuccess: () => void;
}

export default function EditCandidateDialog({ isOpen, onClose, candidate, platform, onSuccess }: EditCandidateDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (candidate) {
            setFormData({ ...candidate });
        }
    }, [candidate]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const table = platform === 'instagram' ? 'candidates_instagram' : 'candidates_tiktok';
            const { error } = await supabase
                .from(table)
                .update(formData)
                .eq('id', candidate.id);

            if (error) throw error;

            toast.success('Candidate updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating candidate:', error);
            toast.error('Failed to update candidate');
        } finally {
            setLoading(false);
        }
    };

    if (!candidate) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Candidate Details</DialogTitle>
                    <DialogDescription>
                        Make changes to the candidate's profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Identity */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Identity</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="kol_name">Name</Label>
                            <Input
                                id="kol_name"
                                value={formData.kol_name || ''}
                                onChange={(e) => handleChange('kol_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username || ''}
                                onChange={(e) => handleChange('username', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profile_url">Profile URL</Label>
                        <Input
                            id="profile_url"
                            value={formData.profile_url || ''}
                            onChange={(e) => handleChange('profile_url', e.target.value)}
                        />
                    </div>

                    {/* Metrics */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Metrics</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="followers">Followers</Label>
                            <Input
                                id="followers"
                                type="number"
                                value={formData.followers || formData.tt_followers || 0}
                                onChange={(e) => handleChange(platform === 'instagram' ? 'followers' : 'tt_followers', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="following">Following</Label>
                            <Input
                                id="following"
                                type="number"
                                value={formData.following || 0}
                                onChange={(e) => handleChange('following', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="posts">Post/Videos</Label>
                            <Input
                                id="posts"
                                type="number"
                                value={formData.posts_count || formData.total_videos || 0}
                                onChange={(e) => handleChange(platform === 'instagram' ? 'posts_count' : 'total_videos', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="likes">Total Likes</Label>
                            <Input
                                id="likes"
                                type="number"
                                value={formData.total_likes || 0}
                                onChange={(e) => handleChange('total_likes', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="views">Avg/Median Views</Label>
                            <Input
                                id="views"
                                type="number"
                                value={formData.median_views || formData.avg_views || 0}
                                onChange={(e) => handleChange(platform === 'instagram' ? 'median_views' : 'avg_views', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="er">ER (%)</Label>
                            <Input
                                id="er"
                                type="number"
                                step="0.01"
                                value={formData.er || 0}
                                onChange={(e) => handleChange('er', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Classification</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category || ''}
                                onValueChange={(value) => handleChange('category', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {KOL_CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="region">Region</Label>
                            <Select
                                value={formData.region || ''}
                                onValueChange={(value) => handleChange('region', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {KOL_REGIONS.map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="segment">Segment</Label>
                            <Select
                                value={formData.segment || ''}
                                onValueChange={(value) => handleChange('segment', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select segment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Mid">Mid</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
