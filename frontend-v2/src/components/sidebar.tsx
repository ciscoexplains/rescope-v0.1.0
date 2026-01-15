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
    Menu,
    TrendingUp,
    Database,
    Briefcase
} from 'lucide-react';

export const Sidebar = () => {
    const pathname = usePathname();
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isDatabasesOpen, setIsDatabasesOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand menus if active
    React.useEffect(() => {
        if (pathname.startsWith('/projects')) setIsProjectsOpen(true);
        if (pathname.startsWith('/tools')) setIsToolsOpen(true);
        if (pathname.startsWith('/databases')) setIsDatabasesOpen(true);
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
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-gray-900 text-white rounded-md shadow-md"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <Menu size={24} />
            </button>

            {/* Sidebar Container */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-40 h-full bg-card/95 backdrop-blur-md border-r border-border 
                    transform transition-all duration-300 ease-in-out text-left flex flex-col shrink-0
                    ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
                    md:relative md:translate-x-0 
                    ${isExpanded ? 'md:w-64' : 'md:w-20'} 
                `}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >

                {/* Header / Logo */}
                <div className={`p-4 border-b border-border flex items-center h-16 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                    {isExpanded ? (
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-white tracking-tight">
                                RE:<span className="text-[var(--color-primary)]">Scope</span>
                            </span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-[var(--color-primary)]">RE</span>
                    )}
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
                            className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap
                            ${false // We handle active state in sub-items usually, or parent if implemented
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                            title={!isExpanded ? "Workdesk" : ""}
                        >
                            <Briefcase size={20} className={`min-w-[20px] ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
                            {isExpanded && (
                                <>
                                    <span className="flex-1 text-left">Workdesk</span>
                                    {isProjectsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </>
                            )}
                        </button>

                        {(isProjectsOpen || !isExpanded) && (
                            isExpanded && isProjectsOpen && (
                                <div className="mt-1 mb-2 space-y-1">
                                    <SubNavItem
                                        href="/workdesk"
                                        label="Active Campaign"
                                        active={pathname.startsWith('/workdesk')}
                                    />
                                    {/* Link to completed projects if we had a separate page */}
                                </div>
                            )
                        )}
                    </div>

                    <div className="mt-2">
                        <button
                            onClick={() => {
                                if (!isExpanded) setIsExpanded(true);
                                setIsToolsOpen(!isToolsOpen);
                            }}
                            className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap
                            ${false
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                            title={!isExpanded ? "Tools" : ""}
                        >
                            <TrendingUp size={20} className={`min-w-[20px] ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
                            {isExpanded && (
                                <>
                                    <span className="flex-1 text-left">Tools</span>
                                    {isToolsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </>
                            )}
                        </button>

                        {(isToolsOpen || !isExpanded) && (
                            isExpanded && isToolsOpen && (
                                <div className="mt-1 mb-2 space-y-1">
                                    <SubNavItem
                                        href="/tools/tiktok-scraper"
                                        label="TikTok Scraper"
                                        active={pathname === '/tools/tiktok-scraper'}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    <div className="mt-2">
                        <button
                            onClick={() => {
                                if (!isExpanded) setIsExpanded(true);
                                setIsDatabasesOpen(!isDatabasesOpen);
                            }}
                            className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap
                            ${false
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                            title={!isExpanded ? "Databases" : ""}
                        >
                            <Database size={20} className={`min-w-[20px] ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
                            {isExpanded && (
                                <>
                                    <span className="flex-1 text-left">Databases</span>
                                    {isDatabasesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </>
                            )}
                        </button>

                        {(isDatabasesOpen || !isExpanded) && (
                            isExpanded && isDatabasesOpen && (
                                <div className="mt-1 mb-2 space-y-1">
                                    <SubNavItem
                                        href="/databases/candidates"
                                        label="Candidates"
                                        active={pathname === '/databases/candidates'}
                                    />
                                    <SubNavItem
                                        href="/databases/tiktok-history"
                                        label="TikTok History"
                                        active={pathname === '/databases/tiktok-history'}
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
                            className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap
                            ${false
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
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

                <div className="p-4 border-t border-border">
                    {isExpanded ? (
                        <p className="text-xs text-center text-gray-500">© 2026 Re:noir Technology</p>
                    ) : (
                        <p className="text-[10px] text-center text-gray-500">© 26</p>
                    )}
                </div>
            </div>
        </>
    );
};
