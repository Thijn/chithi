const mimeMap: Record<string, string> = {
	// Images
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	bmp: 'image/bmp',
	ico: 'image/x-icon',
	avif: 'image/avif',
	// PDF
	pdf: 'application/pdf',
	// Video
	mp4: 'video/mp4',
	webm: 'video/webm',
	ogv: 'video/ogg',
	mov: 'video/quicktime',
	// Audio
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	flac: 'audio/flac',
	// Text / code
	txt: 'text/plain',
	md: 'text/plain',
	json: 'application/json',
	js: 'text/javascript',
	ts: 'text/plain',
	html: 'text/html',
	htm: 'text/html',
	css: 'text/css',
	xml: 'text/xml',
	csv: 'text/csv',
	log: 'text/plain',
	yaml: 'text/plain',
	yml: 'text/plain',
	ini: 'text/plain',
	conf: 'text/plain',
	sql: 'text/plain',
	py: 'text/plain',
	java: 'text/plain',
	c: 'text/plain',
	cpp: 'text/plain',
	h: 'text/plain',
	cs: 'text/plain',
	go: 'text/plain',
	rs: 'text/plain',
	php: 'text/plain',
	rb: 'text/plain',
	sh: 'text/plain',
	bat: 'text/plain',
	ps1: 'text/plain',
	env: 'text/plain',
	svelte: 'text/plain',
	scss: 'text/plain'
};

export function getMimeType(name: string): string {
	const ext = name.split('.').pop()?.toLowerCase() || '';

	return mimeMap[ext] || 'application/octet-stream';
}
