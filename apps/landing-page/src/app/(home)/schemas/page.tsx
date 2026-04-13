import Link from 'next/link';

export default function SchemasPage() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-5xl flex flex-col items-center justify-center min-h-[70vh]">
            <h1 className="h1 mb-4 text-center">API Reference</h1>
            <p className="text-surface-600-400 mb-12 text-center max-w-2xl text-lg">
                Select your preferred interface to interact with the OpenAPI
                specification.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <Link
                    href="/schemas/scalar"
                    className="card p-8 bg-surface-100-900 border border-surface-200-800 rounded-container flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer shadow-sm min-h-62.5 justify-center"
                >
                    <div className="bg-primary-500 rounded-full w-14 h-14 flex items-center justify-center text-white mb-6 text-xl font-bold">
                        Sc
                    </div>
                    <h2 className="h2 mb-4">Scalar</h2>
                    <p className="text-surface-600-400 text-sm">
                        Modern, performant, and beautifully designed API
                        documentation.
                    </p>
                </Link>
                <Link
                    href="/schemas/swaggar"
                    className="card p-8 bg-surface-100-900 border border-surface-200-800 rounded-container flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer shadow-sm min-h-62.5 justify-center"
                >
                    <div className="bg-secondary-500 rounded-full w-14 h-14 flex items-center justify-center text-white mb-6 text-xl font-bold">
                        Sw
                    </div>
                    <h2 className="h2 mb-4">Swagger</h2>
                    <p className="text-surface-600-400 text-sm">
                        The industry-standard classic interactive OpenAPI
                        interface.
                    </p>
                </Link>
            </div>
        </div>
    );
}
