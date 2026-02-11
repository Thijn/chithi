<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		FileText,
		CircleAlert,
		LoaderCircle,
		Download,
		KeyRound,
		Eye,
		File,
		Folder,
		ArrowLeft,
		ExternalLink,
		Image as ImageIcon,
		FileCode,
		FolderOpen,
		FilePlay,
		FileHeadphone
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { fly, fade } from 'svelte/transition';
	import { BACKEND_API } from '#consts/backend';
	import { PasswordRequiredError } from '#functions/download';
	import { createDecryptedStream } from '#functions/streams';
	import { formatFileSize } from '#functions/bytes';
	import { toast } from 'svelte-sonner';
	import { Progress } from '$lib/components/ui/progress';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { ZipReader, BlobReader, TextWriter, BlobWriter, type Entry } from '@zip.js/zip.js';

	// Key is provided in the URL fragment (after '#') and must be present there
	let key = $derived(page.url.hash ? page.url.hash.slice(1).trim() : null);
	let slug = $derived(page.params.slug);

	let status = $state<
		| 'checking'
		| 'ready'
		| 'needs_password'
		| 'error'
		| 'downloading'
		| 'unzipping'
		| 'listing'
		| 'viewing'
	>('checking');
	
	let errorMsg = $state('');
	let filename = $state('file');
	let fileSize = $state(0);
	let password = $state('');
	let downloadProgress = $state(new Tween(0, { duration: 500, easing: cubicOut }));

	let zipEntries = $state<Entry[]>([]);
	let selectedEntry = $state<Entry | null>(null);
	let viewingContent = $state<string | null>(null);
	let viewingType = $state<'text' | 'image' | 'pdf' | 'audio' | 'video' | 'unsupported'>('text');
	let viewingUrl = $state<string | null>(null); // For object URLs
	let decryptedBlob = $state<Blob | null>(null);

	async function startCheck() {
		if (!key || !slug) {
			status = 'error';
			errorMsg = 'Missing decryption key';
			return;
		}
		status = 'checking';
		try {
			const res = await fetch(`${BACKEND_API}/information/${slug}`);
			if (!res.ok) {
				if (res.status === 404) throw new Error('File not found');
				if (res.status === 410) throw new Error('File expired or limit reached');
				throw new Error('Failed to get file info');
			}

			const info = await res.json();
			filename = info.filename;
			fileSize = info.size;
			status = 'ready';
		} catch (e: any) {
			status = 'error';
			errorMsg = e.message || 'An error occurred';
		}
	}

	$effect.pre(() => {
		startCheck();
	});

	async function handlePasswordSubmit() {
		if (!key) return;
		try {
			await fetchAndUnzip();
		} catch (e) {
			// handled in function
		}
	}

	async function fetchAndUnzip() {
		if (!key || !slug) return;
		const previousStatus = status;
		status = 'downloading';
		downloadProgress = new Tween(0, { duration: 500, easing: cubicOut });

		try {
			const blob = await downloadFileBlob(slug, key, password, fileSize, (p) => (downloadProgress.target = p));
			decryptedBlob = blob;
			
			status = 'unzipping';
			const reader = new ZipReader(new BlobReader(blob));
			zipEntries = await reader.getEntries();
			status = 'listing';
			toast.success('Files extracted successfully');

		} catch (e: any) {
			console.error(e);
			if (e instanceof PasswordRequiredError) {
				status = 'needs_password';
				toast.info('Password required for decryption');
			} else if (previousStatus === 'needs_password' && password) {
				toast.error('Incorrect password?');
				status = 'needs_password';
			} else if (e.name === 'AbortError') {
				status = 'ready';
			} else {
				toast.error('Failed: ' + e.message);
				status = 'error';
				errorMsg = 'Processing failed: ' + e.message;
			}
		}
	}

	async function downloadFileBlob(
		slug: string,
		key: string,
		password: string,
		totalSize: number,
		onProgress: (percent: number) => void
	): Promise<Blob> {
		const res = await fetch(`${BACKEND_API}/download/${slug}`);
		if (!res.ok) throw new Error('Download failed');
		if (!res.body) throw new Error('No response body');

		let loaded = 0;
		const reader = res.body.getReader();
		const streamWithProgress = new ReadableStream({
			async pull(controller) {
				try {
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
						return;
					}
					loaded += value.byteLength;
					if (totalSize > 0) {
						onProgress(Math.round((loaded / totalSize) * 100));
					}
					controller.enqueue(value);
				} catch (e) {
					controller.error(e);
					throw e;
				}
			},
			cancel(reason) {
				return reader.cancel(reason);
			}
		});

		const { stream: decryptedStream } = await createDecryptedStream(
			streamWithProgress,
			key,
			password
		);

		const decReader = decryptedStream.getReader();
		let firstChunk: Uint8Array | undefined;
		
		try {
			const { done, value } = await decReader.read();
			if (!done) firstChunk = value;
		} catch (e: any) {
			if (e.name === 'OperationError') {
				await reader.cancel('Wrong password');
				throw new PasswordRequiredError();
			}
			throw e;
		}

		const chunks: Uint8Array[] = [];
		if (firstChunk) chunks.push(firstChunk);
		
		while (true) {
			const { done, value } = await decReader.read();
			if (done) break;
			chunks.push(value);
		}

		return new Blob(chunks as BlobPart[], { type: 'application/zip' });
	}

	async function getEntryBlob(entry: Entry): Promise<{ blob: Blob | null, content: string | null, type: string }> {
		const name = entry.filename.toLowerCase();
		let blob: Blob | null = null;
		let content: string | null = null;
		let type = 'unsupported';

		if (name.match(/\.(pdf)$/)) {
			type = 'pdf';
			if ((entry as any).getData) blob = await (entry as any).getData(new BlobWriter('application/pdf'));
		} else if (name.match(/\.(mp4|webm|ogv|mov|mkv)$/)) {
			type = 'video';
			let mime = 'video/mp4';
			if (name.endsWith('.webm')) mime = 'video/webm';
			if (name.endsWith('.ogv')) mime = 'video/ogg';
			if (name.endsWith('.mov')) mime = 'video/quicktime';
			if (name.endsWith('.mkv')) mime = 'video/x-matroska';
			if ((entry as any).getData) blob = await (entry as any).getData(new BlobWriter(mime));
		} else if (name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)) {
			type = 'audio';
			let mime = 'audio/mpeg';
			if (name.endsWith('.wav')) mime = 'audio/wav';
			if (name.endsWith('.ogg')) mime = 'audio/ogg';
			if (name.endsWith('.m4a') || name.endsWith('.aac')) mime = 'audio/mp4';
			if (name.endsWith('.flac')) mime = 'audio/flac';
			if ((entry as any).getData) blob = await (entry as any).getData(new BlobWriter(mime));
		} else if (name.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|avif)$/)) {
			type = 'image';
			if ((entry as any).getData) blob = await (entry as any).getData(new BlobWriter());
		} else if (
			name.match(
				/\.(txt|md|json|js|ts|svelte|html|css|scss|xml|log|csv|sh|yaml|yml|ini|conf|sql|py|java|c|cpp|h|cs|go|rs|php|rb|lua|r|bat|ps1|properties|env)$/
			)
		) {
			type = 'text';
			if ((entry as any).getData) content = await (entry as any).getData(new TextWriter());
		}

		return { blob, content, type };
	}

	async function viewEntry(entry: Entry) {
		if (entry.directory) return;
		selectedEntry = entry;
		viewingUrl = null;
		viewingContent = null;
		
		const { blob, content, type } = await getEntryBlob(entry);
		viewingType = type as any;
		viewingContent = content;

		if (blob) {
			viewingUrl = URL.createObjectURL(blob);
		}
		status = 'viewing';
	}

	async function openInNewTab(entry: Entry) {
		if (entry.directory) return;
		
		const { blob, content, type } = await getEntryBlob(entry);
		
		if (type === 'text' && content) {
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap;">${content}</pre>`);
				newWindow.document.title = entry.filename;
				newWindow.document.close();
			}
		} else if (blob) {
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
			// increased timeout to allow browser to register the blob url in the new tab
			setTimeout(() => URL.revokeObjectURL(url), 60000); 
		} else {
			toast.error('Cannot open this file type in a new tab');
		}
	}

	function closeView() {
		status = 'listing';
		selectedEntry = null;
		if (viewingUrl) {
			URL.revokeObjectURL(viewingUrl);
			viewingUrl = null;
		}
	}

	function handleDownloadOriginal() {
		if (!decryptedBlob) return;
		const downloadName = filename.toLowerCase().endsWith('.zip') ? filename : `${filename}.zip`;
		const url = URL.createObjectURL(decryptedBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = downloadName;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}
</script>

<Card.Root class="relative z-10 mx-auto w-full max-w-5xl border-border bg-card">
	<Card.Content class="p-6">
		<div class="flex min-h-150 flex-col items-center justify-center">
			
			{#if status === 'checking'}
				<div class="flex flex-col items-center justify-center py-8">
					<LoaderCircle class="mb-4 h-8 w-8 animate-spin text-primary" />
					<p class="text-muted-foreground">Verifying key and file...</p>
				</div>
			{/if}

			{#if status === 'error'}
				{#if !key}
					<div in:fly={{ y: 20, duration: 800 }} class="mx-auto w-full max-w-lg">
						<Card.Header class="px-0 text-center">
							<div class="mx-auto my-3 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
								<KeyRound class="h-10 w-10 text-destructive" />
							</div>
							<Card.Title class="text-2xl font-bold">Decryption Key Required</Card.Title>
							<Card.Description class="mt-2 text-muted-foreground">
								{errorMsg || 'The decryption key is missing.'}
							</Card.Description>
						</Card.Header>
						<Card.Footer class="mt-6 flex w-full flex-col gap-6 px-0">
							<Button class="w-full" variant="outline" href="/">Go Home</Button>
						</Card.Footer>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-8 text-destructive">
						<CircleAlert class="mb-4 h-12 w-12" />
						<p class="font-medium">{errorMsg}</p>
						<Button variant="outline" class="mt-4" onclick={() => location.reload()}>Retry</Button>
					</div>
				{/if}
			{/if}

			{#if status === 'ready' || status === 'needs_password' || status === 'downloading' || status === 'unzipping'}
				<div class="w-full max-w-lg">
					<Card.Header class="px-0 text-center">
						<Card.Title class="text-2xl font-bold">View Archive</Card.Title>
						<Card.Description class="text-muted-foreground">
							Decrypt and view contents of this archive directly in your browser.
						</Card.Description>
					</Card.Header>

					<Card.Content class="w-full px-0">
						{#if status === 'needs_password'}
							<div class="mx-auto flex w-full max-w-sm flex-col items-center gap-2 py-8">
								<div class="flex w-full items-center">
									<Input
										type="password"
										placeholder="Password"
										class="rounded-r-none focus-visible:z-10"
										bind:value={password}
										onkeydown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
									/>
									<Button class="rounded-l-none" onclick={handlePasswordSubmit}>Unlock</Button>
								</div>
								<p class="text-xs text-muted-foreground">Enter password to decrypt the archive.</p>
							</div>
						{:else}
							<div class="mb-6 flex items-center gap-4 rounded-lg border bg-background/50 p-4">
								<div class="rounded bg-primary/10 p-2 text-primary">
									{#if status === 'downloading' || status === 'unzipping'}
										<LoaderCircle class="h-6 w-6 animate-spin" />
									{:else}
										<FileText class="h-6 w-6" />
									{/if}
								</div>
								<div class="flex-1 overflow-hidden">
									<p class="truncate font-medium">{filename}</p>
									<p class="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
								</div>
							</div>

							<Card.Footer class="flex w-full flex-col gap-6 px-0">
								{#if status === 'downloading' || status === 'unzipping'}
									<div class="w-full space-y-2">
										<Progress value={downloadProgress.current} class="h-2" />
										<div class="flex justify-between text-xs text-muted-foreground">
											<span>{Math.round(downloadProgress.current)}%</span>
											<span class="flex items-center">
												{#if status === 'unzipping'}
													<FolderOpen class="mr-2 h-3 w-3 animate-pulse" />
													Unzipping...
												{:else}
													<Download class="mr-2 h-3 w-3 animate-bounce" />
													Decrypting...
												{/if}
											</span>
										</div>
									</div>
								{:else}
									<Button class="w-full" size="lg" onclick={fetchAndUnzip}>
										<Eye class="mr-2 h-4 w-4" />
										View Contents
									</Button>
								{/if}
							</Card.Footer>
						{/if}
					</Card.Content>
				</div>
			{/if}

			{#if status === 'listing'}
				<div class="w-full" in:fade={{ duration: 300 }}>
					<div class="mb-4 flex items-center justify-between">
						<div>
							<h2 class="text-xl font-bold">Contents of {filename}</h2>
							<p class="text-sm text-muted-foreground">{zipEntries.length} items found</p>
						</div>
						<Button variant="outline" onclick={handleDownloadOriginal}>
							<Download class="mr-2 h-4 w-4" />
							Download Original
						</Button>
					</div>
					
					<div class="rounded-md border">
						<ScrollArea class="h-125">
							<div class="p-2">
								{#each zipEntries as entry}
									<div
										class="group flex w-full items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
									>
										<button 
											class="flex-1 flex items-center gap-3 text-left overflow-hidden cursor-pointer bg-transparent border-0 p-0" 
											onclick={() => viewEntry(entry)}
										>
											{#if entry.directory}
												<Folder class="h-5 w-5 text-primary shrink-0" />
											{:else if entry.filename.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|bmp|avif)$/i)}
												<ImageIcon class="h-5 w-5 text-primary shrink-0" />
											{:else if entry.filename.match(/\.(mp4|webm|ogv|mov|mkv)$/i)}
												<FilePlay class="h-5 w-5 text-primary shrink-0" />
											{:else if entry.filename.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)}
												<FileHeadphone class="h-5 w-5 text-primary shrink-0" />
											{:else if entry.filename.match(/\.(txt|md|json|js|ts|svelte|html|css|scss|xml|log|csv|sh|yaml|yml|ini|conf|sql|py|java|c|cpp|h|cs|go|rs|php|rb|lua|r|bat|ps1|properties|env)$/i)}
												<FileCode class="h-5 w-5 text-primary shrink-0" />
											{:else}
												<File class="h-5 w-5 text-muted-foreground shrink-0" />
											{/if}
											
											<div class="flex-1 overflow-hidden">
												<p class="truncate text-sm font-medium">{entry.filename}</p>
												{#if !entry.directory}
													<p class="text-xs text-muted-foreground">{formatFileSize(entry.uncompressedSize)}</p>
												{/if}
											</div>
										</button>

										{#if !entry.directory}
											<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button variant="ghost" size="icon" class="h-8 w-8" title="View Here" onclick={() => viewEntry(entry)}>
													<Eye class="h-4 w-4" />
												</Button>
												<Button variant="ghost" size="icon" class="h-8 w-8" title="Open in New Tab" onclick={() => openInNewTab(entry)}>
													<ExternalLink class="h-4 w-4" />
												</Button>
											</div>
										{/if}
									</div>
								{/each}
								{#if zipEntries.length === 0}
									<div class="p-8 text-center text-muted-foreground">
										No files found in this archive.
									</div>
								{/if}
							</div>
						</ScrollArea>
					</div>
				</div>
			{/if}

			{#if status === 'viewing' && selectedEntry}
				<div class="w-full h-full flex flex-col" in:fade={{ duration: 300 }}>
					<div class="mb-4 flex items-center gap-2">
						<Button variant="ghost" size="icon" onclick={closeView}>
							<ArrowLeft class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-semibold truncate">{selectedEntry.filename}</h2>
					</div>

					<div class="flex-1 rounded-md border min-h-100 bg-background/50 overflow-hidden relative">
						{#if viewingType === 'text'}
							<pre class="p-4 text-sm font-mono overflow-auto h-150 w-full">{viewingContent}</pre>
						{:else if viewingType === 'image' && viewingUrl}
							<div class="flex items-center justify-center p-4 h-150">
								<img src={viewingUrl} alt={selectedEntry.filename} class="max-w-full max-h-full object-contain" />
							</div>
						{:else if viewingType === 'pdf' && viewingUrl}
							<iframe src={viewingUrl} title={selectedEntry.filename} class="w-full h-150 border-0"></iframe>
						{:else if viewingType === 'video' && viewingUrl}
							<div class="flex items-center justify-center p-4 h-150 bg-black">
								<!-- svelte-ignore a11y_media_has_caption -->
								<video src={viewingUrl} controls class="max-w-full max-h-full"></video>
							</div>
						{:else if viewingType === 'audio' && viewingUrl}
							<div class="flex flex-col items-center justify-center p-4 h-150">
								<div class="mb-8 p-6 rounded-full bg-primary/10">
									<FileHeadphone class="h-16 w-16 text-primary" />
								</div>
								<h3 class="mb-4 text-lg font-medium">{selectedEntry.filename}</h3>
								<audio src={viewingUrl} controls class="w-full max-w-md"></audio>
							</div>
						{:else}
							<div class="flex flex-col items-center justify-center h-100 text-muted-foreground">
								<FileText class="h-16 w-16 mb-4 opacity-20" />
								<p>Preview not available for this file type.</p>
								<p class="text-sm mt-2">({selectedEntry.filename})</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

		</div>
	</Card.Content>
</Card.Root>
