'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-main)]">About Re:noir</h1>
                <p className="text-gray-500 mt-1">Company information and contacts.</p>
            </div>

            <Card>
                <CardHeader>
                    {/* Logo could go here */}
                    <CardTitle className="text-2xl">Re:noir Technology</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose max-w-none text-gray-600">
                        <p className="mb-4">
                            We are Re:noir Technology, an IT Consultant and Data Analysis & Engineering Provider based in Jakarta Indonesia. Established in 2026 and we tailor made your Data Processing and Analysis needs along with other IT Provider services at our disposal.
                        </p>
                    </div>

                    <div className="bg-[var(--color-base)] p-6 rounded-xl border border-gray-100">
                        <h3 className="font-semibold text-lg mb-4 text-[var(--color-text-main)]">Contact Us</h3>
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="font-medium min-w-32">Commercial:</span>
                                <a href="tel:+6282218017440" className="text-[var(--color-primary)] hover:underline">+6282218017440 (Zaky)</a>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="font-medium min-w-32">Technical:</span>
                                <a href="tel:+6281953643434" className="text-[var(--color-primary)] hover:underline">+6281953643434 (Julian)</a>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
