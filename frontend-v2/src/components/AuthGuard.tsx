'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const isLoginPage = pathname === '/login';
                const isAdminPage = pathname.startsWith('/admin');

                if (!session && !isLoginPage) {
                    router.replace('/login');
                    return;
                }

                if (session) {
                    const userEmail = session.user.email || '';
                    const isAdminUser = userEmail.endsWith('@admin.dev');

                    if (isLoginPage) {
                        router.replace(isAdminUser ? '/admin' : '/');
                    } else if (isAdminPage && !isAdminUser) {
                        router.replace('/');
                    } else if (!isAdminPage && isAdminUser && pathname === '/') {
                        router.replace('/admin');
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const isLoginPage = pathname === '/login';
            if (!session && !isLoginPage) {
                router.replace('/login');
            } else if (session) {
                const userEmail = session.user.email || '';
                const isAdminUser = userEmail.endsWith('@admin.dev');

                if (isLoginPage) {
                    router.replace(isAdminUser ? '/admin' : '/');
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    if (pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out bg-background">
                {children}
            </main>
        </div>
    );
}
