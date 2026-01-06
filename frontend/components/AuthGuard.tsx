'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const isLoggedIn = pb.authStore.isValid;
        const isLoginPage = pathname === '/login';

        if (!isLoggedIn && !isLoginPage) {
            router.replace('/login');
        } else if (isLoggedIn && isLoginPage) {
            router.replace('/');
        } else {
            setChecked(true);
        }
    }, [pathname, router]);

    if (!checked) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    // If on login page, render only the content (Login Page handles its own layout)
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // Otherwise, render the authenticated dashboard layout
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
