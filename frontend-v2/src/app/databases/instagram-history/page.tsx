import DashboardHeader from "@/components/DashboardHeader";
import InstagramHistoryTable from "@/components/database/InstagramHistoryTable";

export default function InstagramHistoryPage() {
    return (
        <div className="p-6 space-y-6">
            <DashboardHeader
                customGreeting="Instagram Scraper History"
                title="View and manage your Instagram scraping results"
            />
            <InstagramHistoryTable />
        </div>
    );
}
