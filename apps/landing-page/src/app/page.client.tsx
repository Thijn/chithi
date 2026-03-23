'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Release = { tag_name?: string } | null;

export default function HomeClient({ release }: { release: Release }) {
    const [showCopy, setShowCopy] = useState(false);

    const copyCommand = async () => {
        try {
            await navigator.clipboard.writeText('docker compose up --build');
            setShowCopy(true);
            setTimeout(() => setShowCopy(false), 1600);
        } catch {}
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-black selection:text-white">
            <header className="border-b border-slate-200">
                <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/favicon.svg"
                            alt="logo"
                            width={28}
                            height={28}
                        />
                        <span className="font-semibold tracking-tight">
                            CHITHI
                        </span>
                    </div>

                    <nav className="flex items-center gap-4 text-sm">
                        <Link
                            href="/scalar"
                            className="text-slate-600 hover:text-slate-900"
                        >
                            Docs
                        </Link>
                        <a
                            href="https://github.com/chithi-dev/chithi"
                            className="text-slate-600 hover:text-slate-900"
                        >
                            GitHub
                            {release?.tag_name ? ` /${release.tag_name}` : ''}
                        </a>
                    </nav>
                </div>
            </header>

            <main className="flex min-h-[70vh] items-center">
                <div className="mx-auto max-w-4xl px-6 py-24 text-center">
                    <h1 className="mb-6 text-4xl font-extrabold leading-tight">
                        Secure file sharing
                    </h1>

                    <p className="mb-8 text-lg text-slate-600 max-w-2xl mx-auto">
                        Self-host, encrypt client-side, and share files safely —
                        small, fast, and open-source.
                    </p>

                    <div className="flex justify-center gap-4">
                        <a
                            href="https://github.com/chithi-dev/chithi"
                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                        >
                            View source
                        </a>

                        <button
                            onClick={copyCommand}
                            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                        >
                            Install
                        </button>
                    </div>

                    {showCopy && (
                        <div className="mt-6 text-sm text-green-600">
                            Copied install command
                        </div>
                    )}
                </div>
            </main>

            <footer className="border-t border-slate-100">
                <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} CHITHI — Open, minimal, secure.
                </div>
            </footer>
        </div>
    );
}
