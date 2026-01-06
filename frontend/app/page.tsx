'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, UserCheck, UserMinus, Trash2, Loader2, Folder, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import PocketBase from 'pocketbase';
import statsFormatter from '../lib/utils'; // You might need to move statsFormatter to utils or keep it local

// Initialize PocketBase client-side
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

export default function Home() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); // 'analyzing' | 'searching' | 'saving'

  const [formData, setFormData] = useState({
    campaignName: '',
    prompt: '',
    clientName: '',
    minFollowers: '',
    maxFollowers: '',
    minScraped: '10', // Default
    maxScraped: '20',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input Change: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt) return;

    setLoading(true);
    setLoadingStep('analyzing');

    try {
      // 1. Analyze Prompt using Gemini to get Categories
      const recommendRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: formData.prompt }),
      });

      if (!recommendRes.ok) throw new Error('Failed to analyze prompt');
      const recommendData = await recommendRes.json();
      const categoriesToSearch = recommendData.results || [];

      // 2. Create Campaign Record (Status: Loading)
      setLoadingStep('creating_campaign');
      const campaignRecord = await pb.collection('campaigns').create({
        name: formData.campaignName,
        prompt: formData.prompt,
        client_name: formData.clientName,
        status: 'Loading',
        min_followers: Number(formData.minFollowers) || 0,
        max_followers: Number(formData.maxFollowers) || 0,
        min_scraped: Number(formData.minScraped) || 0,
        max_scraped: Number(formData.maxScraped) || 0,
      });

      // 3. Search Profiles using Apify
      setLoadingStep('searching');
      let combinedResults: any[] = [];

      // Limit search to the user's "Max Scraped" setting per category (simplification)
      const limitPerCat = Math.ceil((Number(formData.maxScraped) || 20) / Math.max(categoriesToSearch.length, 1));

      for (const cat of categoriesToSearch) {
        if (cat.queries && cat.queries.length > 0) {
          const query = cat.queries[0];
          const searchRes = await fetch('/api/apify/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, limit: limitPerCat }),
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const tagged = (searchData.results || []).map((item: any) => ({
              ...item,
              sourceCategory: cat.category,
              categories: [cat.main_category, cat.sub_category]
            }));
            combinedResults = [...combinedResults, ...tagged];
          }
        }
      }

      // Deduplicate by username AND Filter by Followers
      const uniqueResults: any[] = [];
      const seenUsers = new Set<string>();
      const minF = Number(formData.minFollowers) || 0;
      const maxF = formData.maxFollowers ? Number(formData.maxFollowers) : Infinity;

      for (const item of combinedResults) {
        const username = item.authorMeta?.name?.toLowerCase();
        const followers = item.authorMeta?.fans || 0;

        if (username && !seenUsers.has(username)) {
          // Apply Follower Filter
          if (followers >= minF && followers <= maxF) {
            seenUsers.add(username);
            uniqueResults.push(item);
          }
        }
      }

      // 4. Save Candidates to PocketBase
      setLoadingStep('saving');

      const savePromises = uniqueResults.map(async (item) => {
        try {
          const followers = item.authorMeta?.fans || 0;
          let tier = 'Nano';
          if (followers >= 1000000) tier = 'Mega';
          else if (followers >= 100000) tier = 'Mid/Macro';
          else if (followers >= 10000) tier = 'Micro';
          else if (followers >= 2000) tier = 'Nano';
          else tier = 'Unlisted'; // Default for < 2000

          const er = 0; // Will be analyzed later

          await pb.collection('candidates').create({
            campaign: campaignRecord.id,
            kol_id: `KOL${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
            kol_name: item.authorMeta?.nickName || item.authorMeta?.name || 'Unknown',
            contact: 'None',
            contact_name: 'None',
            email: 'None',
            instagram: '', // Explicit empty string instead of null
            tiktok: item.authorMeta?.name || '',
            ig_followers: 0,
            tt_followers: followers,
            tier: tier,
            er: er,
            avg_views: item.playCount || 0,
            reach: item.playCount || Math.round(followers * 0.1),
            is_verified: item.authorMeta?.verified || false,
            genuine_rate: 0, // Legacy
            match_score: 0, // Legacy
            type: 'Influencer',
            categories: item.categories || [],
            grade: 'None',
            region: [],
            gender: 'Unknown',
            age: 'Unknown',
            religion: 'Unknown',
            avatar: item.authorMeta?.avatar || '',
            username: item.authorMeta?.name || '',
            signature: item.authorMeta?.signature || '',
            status: 'New'
          }, { requestKey: null }); // Disable auto-cancellation for parallel requests
        } catch (err) {
          console.error("Failed to save candidate:", item.authorMeta?.name, err);
        }
      });

      await Promise.all(savePromises);

      // 5. Update Campaign Status
      await pb.collection('campaigns').update(campaignRecord.id, {
        status: 'Ongoing',
        kol_count: uniqueResults.length
      });

      // 6. Close Modal and Redirect
      setIsCreateModalOpen(false);
      setLoading(false);
      router.push(`/projects/active`);

    } catch (error) {
      console.error("Campaign Creation Failed:", error);
      alert("Failed to create campaign. Check console for details.");
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Dashboard State
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalScraped: 0,
    reviewed: 0,
    underReview: 0,
    trashed: 0,
  });

  const [summaryData, setSummaryData] = useState({
    avgER: '0.0%',
    categories: [] as string[],
    regions: [] as string[],
    tiers: [] as string[],
  });

  const [tierData, setTierData] = useState<Record<string, number>>({});

  const fetchStats = async () => {
    try {
      // 1. Fetch Counts (Optimized)
      const [
        activeCampResult,
        completedCampResult,
        allResult,
        reviewedResult,
        trashedResult,
        recentCandidates
      ] = await Promise.all([
        pb.collection('campaigns').getList(1, 1, { filter: 'status != "Completed"', requestKey: null }),
        pb.collection('campaigns').getList(1, 1, { filter: 'status = "Completed"', requestKey: null }),
        pb.collection('candidates').getList(1, 1, { requestKey: null }),
        pb.collection('candidates').getList(1, 1, { filter: 'status = "Reviewed"', requestKey: null }),
        pb.collection('candidates').getList(1, 1, { filter: 'status = "Trashed"', requestKey: null }),
        pb.collection('candidates').getList(1, 200, { requestKey: null }) // Fetch last 200 for insights
      ]);

      // 2. Update Basic Stats
      const total = allResult.totalItems;
      const reviewed = reviewedResult.totalItems;
      const trashed = trashedResult.totalItems;

      setStats({
        activeCampaigns: activeCampResult.totalItems,
        completedCampaigns: completedCampResult.totalItems,
        totalScraped: total,
        reviewed: reviewed,
        underReview: Math.max(0, total - reviewed - trashed),
        trashed: trashed,
      });

      // 3. Calculate Insights from Recent Data
      const items = recentCandidates.items;

      // ER Calc
      const totalER = items.reduce((sum, item) => sum + (item.er || 0), 0);
      const avgER = items.length > 0 ? (totalER / items.length).toFixed(1) + '%' : '0.0%';

      // Frequency Counters
      const catCount: Record<string, number> = {};
      const regCount: Record<string, number> = {};
      const tCount: Record<string, number> = {};

      items.forEach(item => {
        // Categories
        if (item.categories && Array.isArray(item.categories)) {
          item.categories.forEach((c: string) => catCount[c] = (catCount[c] || 0) + 1);
        }
        // Regions
        if (item.region && Array.isArray(item.region)) {
          item.region.forEach((r: string) => regCount[r] = (regCount[r] || 0) + 1);
        }
        // Tiers
        if (item.tier) {
          tCount[item.tier] = (tCount[item.tier] || 0) + 1;
        }
      });

      // Sort and Top N
      const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
      const topRegs = Object.entries(regCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
      const topTiers = Object.entries(tCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

      setSummaryData({
        avgER,
        categories: topCats,
        regions: topRegs,
        tiers: topTiers
      });

      setTierData(tCount);

    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    // Subscribe to candidates for realtime updates
    pb.collection('candidates').subscribe('*', () => {
      fetchStats();
    });
    return () => {
      pb.collection('candidates').unsubscribe();
    };
  }, []);

  const dashboardStats = [
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Folder, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Completed Campaigns', value: stats.completedCampaigns, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: 'Total Scraped KOLs', value: statsFormatter(stats.totalScraped), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Reviewed KOLs', value: statsFormatter(stats.reviewed), icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Under-Reviewed KOLs', value: statsFormatter(stats.underReview), icon: UserMinus, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Trashed / Ignored', value: statsFormatter(stats.trashed), icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  /* Tier Heatmap Config */
  const TIER_DEFINITIONS = [
    { name: 'Nano', color: 'bg-gray-100 text-gray-800', range: '1K - 10K' },
    { name: 'Micro', color: 'bg-blue-100 text-blue-800', range: '10K - 50K' },
    { name: 'Mid/Macro', color: 'bg-purple-100 text-purple-800', range: '50K - 1M' },
    { name: 'Mega', color: 'bg-orange-100 text-orange-800', range: '1M - 5M' },
    { name: 'Super', color: 'bg-yellow-100 text-yellow-800', range: '> 5M' },
    { name: 'Unlisted', color: 'bg-gray-50 text-gray-500', range: '?' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-main)]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your influencer campaigns and insights.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Summary Box */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Summary</CardTitle>
          <CardDescription>Performance based on recent 200 candidates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. ER%</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{summaryData.avgER}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Top Categories</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {summaryData.categories.length > 0 ? summaryData.categories.map(c => (
                  <span key={c} className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">{c}</span>
                )) : <span className="text-gray-400 text-sm">-</span>}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Top Regions</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {summaryData.regions.length > 0 ? summaryData.regions.map(r => (
                  <span key={r} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{r}</span>
                )) : <span className="text-gray-400 text-sm">-</span>}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Dominant Tiers</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {summaryData.tiers.length > 0 ? summaryData.tiers.map(t => (
                  <span key={t} className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">{t}</span>
                )) : <span className="text-gray-400 text-sm">-</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                <div className={`px-4 py-2 rounded-full ${stat.bg} w-fit flex items-center gap-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <p className="text-sm font-medium text-gray-500 ml-1">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tier Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Heatmap</CardTitle>
          <CardDescription>Distribution of influencers by tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {TIER_DEFINITIONS.map((tierDef) => {
              const count = tierData[tierDef.name] || 0;
              return (
                <div key={tierDef.name} className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all hover:scale-105 ${tierDef.color}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{tierDef.name}</span>
                  <span className="text-3xl font-bold">{count}</span>
                  <span className="text-[10px] opacity-60 bg-white/50 px-2 py-0.5 rounded-full">
                    {tierDef.range}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !loading && setIsCreateModalOpen(false)}
        title="Create New Campaign"
        width="max-w-2xl"
      >
        {/* DEBUG: Remove later */}
        <div className="text-xs text-gray-400 mb-2">Debug: Loading state = {loading.toString()}</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Campaign Name"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleInputChange}
            placeholder="e.g. Summer Skincare Launch"
            fullWidth
            required
            disabled={loading}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--color-text-main)]">Prompt Analysis</label>
            <textarea
              name="prompt"
              rows={4}
              value={formData.prompt}
              onChange={handleInputChange}
              className="block w-full rounded-lg border-gray-300 border outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] px-4 py-2 text-[var(--color-text-main)] bg-white resize-none"
              placeholder="Describe your ideal KOLs and campaign goals..."
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--color-text-main)]">Client Name</label>
            <select
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              className="block w-full rounded-lg border-gray-300 border outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] px-4 py-2 text-[var(--color-text-main)] bg-white"
              disabled={loading}
            >
              <option value="">Select Client</option>
              <option value="Client A">Client A</option>
              <option value="Client B">Client B</option>
              <option value="Client C">Client C</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">KOL Followers Range</label>
              <div className="flex items-center gap-2">
                <Input
                  name="minFollowers"
                  type="number"
                  placeholder="Min"
                  value={formData.minFollowers}
                  onChange={handleInputChange}
                  fullWidth
                  min="0"
                  disabled={loading}
                />
                <span className="text-gray-400">-</span>
                <Input
                  name="maxFollowers"
                  type="number"
                  placeholder="Max"
                  value={formData.maxFollowers}
                  onChange={handleInputChange}
                  fullWidth
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">KOLs Scraped Range</label>
              <div className="flex items-center gap-2">
                <Input
                  name="minScraped"
                  type="number"
                  placeholder="Min"
                  value={formData.minScraped}
                  onChange={handleInputChange}
                  fullWidth
                  min="1"
                  disabled={loading}
                />
                <span className="text-gray-400">-</span>
                <Input
                  name="maxScraped"
                  type="number"
                  placeholder="Max"
                  value={formData.maxScraped}
                  onChange={handleInputChange}
                  fullWidth
                  min="1"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" size="lg" disabled={loading} isLoading={loading}>
              {loading ? (
                loadingStep === 'analyzing' ? 'Analyzing Prompt...'
                  : loadingStep === 'searching' ? 'Finding KOLs...'
                    : loadingStep === 'saving' ? 'Saving Candidates...'
                      : 'Processing...'
              ) : 'Submit Campaign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
