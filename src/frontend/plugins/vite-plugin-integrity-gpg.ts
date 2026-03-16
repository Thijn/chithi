import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

interface Options {
	buildDir?: string;
	keyId?: string;
}

export default function integrityPlugin(options: Options = {}): Plugin {
	const buildDir = options.buildDir || 'build';
	const keyId = options.keyId;

	return {
		name: 'vite-plugin-integrity-gpg',
		apply: 'build',

		closeBundle() {
			const clientDir = path.resolve(process.cwd(), buildDir, 'client');
			const files: Record<string, string> = {};

			function walk(dir: string) {
				for (const entry of fs.readdirSync(dir)) {
					const full = path.join(dir, entry);
					const stat = fs.statSync(full);

					if (stat.isDirectory()) {
						walk(full);
						continue;
					}

					if (entry === 'integrity.json' || entry === 'integrity.json.asc') continue;

					const data = fs.readFileSync(full);
					const hash = crypto.createHash('sha256').update(data).digest('hex');

					const rel = path.relative(clientDir, full).replace(/\\/g, '/');

					files[`/${rel}`] = `sha256:${hash}`;
				}
			}

			walk(clientDir);

			const integrity = {
				generated: new Date().toISOString(),
				files
			};

			const integrityPath = path.join(clientDir, 'integrity.json');

			fs.writeFileSync(integrityPath, JSON.stringify(integrity, null, 2));

			console.log('Generated integrity.json');

			const cmd = keyId
				? `gpg --armor --detach-sign --local-user ${keyId} "${integrityPath}"`
				: `gpg --armor --detach-sign "${integrityPath}"`;

			execSync(cmd, { stdio: 'inherit' });

			console.log('Generated integrity.json.asc');
		}
	};
}
