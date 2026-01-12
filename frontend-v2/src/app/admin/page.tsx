import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DashboardHeader from "@/components/DashboardHeader";

export default function AdminDashboard() {
    return (
        <div className="p-6">
            <DashboardHeader title="System Overview & Controls" />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>System Overview</CardTitle>
                        <CardDescription>Monitor system health and stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">System functionality will be added here.</p>
                    </CardContent>
                </Card>

                {/* Placeholder for future admin features */}
            </div>
        </div>
    );
}
