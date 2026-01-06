'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    Home,
    Folder,
    Settings as SettingsIcon,
    ChevronDown,
    ChevronRight,
    Menu
} from 'lucide-react';

export const Sidebar = () => {
    const pathname = usePathname();
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand menus if active
    React.useEffect(() => {
        if (pathname.startsWith('/projects')) setIsProjectsOpen(true);
        if (pathname.startsWith('/settings')) setIsSettingsOpen(true);
    }, [pathname]);

    const NavItem = ({ href, icon: Icon, label, active, onClick }: { href?: string; icon?: any; label: string; active?: boolean; onClick?: () => void }) => {
        const Component = href ? Link : 'button';
        return (
            <Component
                href={href || ''}
                onClick={onClick}
                className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap
          ${active
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-[var(--color-text-main)] hover:bg-[var(--color-accent)]'
                    }`}
                title={!isExpanded ? label : ''}
            >
                {Icon && <Icon size={20} className={`min-w-[20px] ${isExpanded ? 'mr-3' : 'mx-auto'}`} />}
                {isExpanded && <span className="flex-1 text-left fade-in">{label}</span>}
            </Component>
        );
    };

    const SubNavItem = ({ href, label, active }: { href: string; label: string; active: boolean }) => (
        <Link
            href={href}
            className={`block w-full py-2 text-sm transition-colors rounded-lg overflow-hidden whitespace-nowrap
        ${active
                    ? 'text-[var(--color-primary)] font-semibold bg-[var(--color-accent)]'
                    : 'text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-50'
                }
        ${isExpanded ? 'pl-12 pr-4' : 'px-2 text-center text-[10px]'}
        `}
        >
            {isExpanded ? label : label.split(' ')[0]} {/* Abbreviate or hide if collapsed */}
        </Link>
    );

    return (
        <>
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-md shadow-md"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <Menu size={24} />
            </button>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-40 h-full bg-white border-r border-gray-200 
                transform transition-all duration-300 ease-in-out text-left flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
                md:relative md:translate-x-0 
                ${isExpanded ? 'md:w-64' : 'md:w-20'} 
            `}>

                {/* Header / Logo */}
                <div className={`p-4 border-b border-gray-100 flex items-center h-16 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                    {isExpanded ? (
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-[var(--color-primary)] tracking-tight">
                                RE:<span className="text-black">Scope</span>
                            </span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-[var(--color-primary)]">RE</span>
                    )}

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hidden md:block"
                    >
                        {isExpanded ? <ChevronDown className="rotate-90" size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden space-y-2">
                    <NavItem
                        href="/"
                        icon={Home}
                        label="Home"
                        active={pathname === '/'}
                    />

                    <div className="mt-2">
                        <button
                            onClick={() => {
                                if (!isExpanded) setIsExpanded(true);
                                setIsProjectsOpen(!isProjectsOpen);
                            }}
                            className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-accent)] overflow-hidden whitespace-nowrap`}
                            title={!isExpanded ? "Projects" : ""}
                        >
                            <Folder size={20} className={`min-w-[20px] ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
                            {isExpanded && (
                                <>
                                    <span className="flex-1 text-left">Projects</span>
                                    {isProjectsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </>
                            )}
                        </button>

                        {(isProjectsOpen || !isExpanded) && ( /* Show submenu if open OR if collapsed (maybe simplified?) No, usually hide in collapsed */
                            isExpanded && isProjectsOpen && (
                                <div className="mt-1 mb-2 space-y-1">
                                    <SubNavItem
                                        href="/projects/active"
                                        label="Active Campaign"
                                        active={pathname.startsWith('/projects/active')}
                                    />
                                    <SubNavItem
                                        href="/projects/completed"
                                        label="Completed Campaign"
                                        active={pathname.startsWith('/projects/completed')}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    <div className="mt-2">
                        <button
                            onClick={() => {
                                if (!isExpanded) setIsExpanded(true);
                                setIsSettingsOpen(!isSettingsOpen);
                            }}
                            className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-accent)] overflow-hidden whitespace-nowrap`}
                            title={!isExpanded ? "Settings" : ""}
                        >
                            <SettingsIcon size={20} className={`min-w-[20px] ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
                            {isExpanded && (
                                <>
                                    <span className="flex-1 text-left">Settings</span>
                                    {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </>
                            )}
                        </button>

                        {isExpanded && isSettingsOpen && (
                            <div className="mt-1 mb-2 space-y-1">
                                <SubNavItem
                                    href="/settings/profile"
                                    label="Edit Profile"
                                    active={pathname === '/settings/profile'}
                                />
                                <SubNavItem
                                    href="/settings/account"
                                    label="Account Name"
                                    active={pathname === '/settings/account'}
                                />
                                <SubNavItem
                                    href="/settings/clients"
                                    label="Client Names"
                                    active={pathname === '/settings/clients'}
                                />
                                <SubNavItem
                                    href="/settings/about"
                                    label="About Re:noir"
                                    active={pathname === '/settings/about'}
                                />
                            </div>
                        )}
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    {isExpanded ? (
                        <p className="text-xs text-center text-gray-400">© 2026 Re:noir Technology</p>
                    ) : (
                        <p className="text-[10px] text-center text-gray-400">© 26</p>
                    )}
                </div>
            </div>
        </>
    );
};
