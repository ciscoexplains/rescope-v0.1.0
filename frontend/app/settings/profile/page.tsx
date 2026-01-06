'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Edit Profile</h1>
                <p className="text-gray-500 mt-1">Update your personal information.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400">
                            A
                        </div>
                        <div>
                            <CardTitle>Profile Picture</CardTitle>
                            <Button variant="ghost" size="sm" className="mt-1 -ml-2 text-[var(--color-primary)]">Change Photo</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="First Name" defaultValue="Admin" fullWidth />
                            <Input label="Last Name" defaultValue="User" fullWidth />
                        </div>
                        <Input label="Email Address" type="email" defaultValue="admin@renoir.tech" fullWidth />
                        <Input label="Phone Number" type="tel" defaultValue="+62" fullWidth />

                        <div className="pt-4 flex justify-end">
                            <Button>Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
