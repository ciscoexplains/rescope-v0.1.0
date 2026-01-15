'use client';

import DashboardHeader from "@/components/DashboardHeader";
import TikTokHistoryTable from "@/components/database/TikTokHistoryTable";

export default function TikTokHistoryPage() {
    return (
        <div className="p-6 space-y-6">
            <DashboardHeader title="TikTok Scraper History" />
            <TikTokHistoryTable />
        </div>
    );
}
