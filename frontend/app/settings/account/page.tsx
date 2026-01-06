'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AccountPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Account Name</h1>
                <p className="text-gray-500 mt-1">Manage your account credentials and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>This is how you will be identified in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <Input label="Username" defaultValue="renoir_admin" fullWidth />
                        <Input label="Display Name" defaultValue="Renoir Admin" fullWidth />

                        <div className="pt-4 flex justify-end">
                            <Button>Update Account</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <Input label="Current Password" type="password" fullWidth />
                        <Input label="New Password" type="password" fullWidth />
                        <Input label="Confirm New Password" type="password" fullWidth />

                        <div className="pt-4 flex justify-end">
                            <Button variant="secondary">Change Password</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
