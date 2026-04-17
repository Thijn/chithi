import { Octokit } from 'octokit';

// Server-only Octokit singleton. Import from '@/providers/octokit.server' in server components.
export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || undefined,
    request: {
        fetch: (url: string, opts: any) => {
            return fetch(url, {
                ...opts,
                next: {
                    revalidate: 10, // Cache for 10 seconds to prevent rate limits
                },
            });
        },
    },
});
