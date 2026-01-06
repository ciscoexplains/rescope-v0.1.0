'use client';

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                            <img
                                className="h-8 w-auto" // Adjusted height for typical menubar logo
                                src="/rescope-logo.png"
                                alt="Re:Scope Logo"
                            />
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/"
                            className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Home
                        </Link>
                        <Link
                            href="/search-profiles"
                            className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Search Profiles
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
