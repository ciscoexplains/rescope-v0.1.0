'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardHeader({ title, children }: { title?: string, children?: React.ReactNode }) {
    const [greeting, setGreeting] = useState('Hi, there');
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                if (user.email.endsWith('@admin.dev')) {
                    setGreeting('Hi, Admin');
                } else {
                    setGreeting(`Hi, ${user.email}`);
                }
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to log out');
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
                {title && <p className="text-muted-foreground mt-1">{title}</p>}
            </div>

            <div className="flex items-center gap-3">
                {children}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors w-fit"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );
}
