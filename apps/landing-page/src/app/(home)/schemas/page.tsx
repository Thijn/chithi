import Link from 'next/link';
import { SiScalar, SiSwagger } from '@icons-pack/react-simple-icons';

const SCHEMA_OPTIONS = [
    {
        id: 'scalar',
        href: '/schemas/scalar',
        icon: SiScalar,
        name: 'Scalar',
        desc: 'Modern, performant, and beautifully designed API documentation.',
        colorClass: 'bg-primary-500',
    },
    {
        id: 'swagger',
        href: '/schemas/swaggar',
        icon: SiSwagger,
        name: 'Swagger',
        desc: 'The industry-standard classic interactive OpenAPI interface.',
        colorClass: 'bg-secondary-500',
    },
];

export default function SchemasPage() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-5xl flex flex-col items-center justify-center min-h-[70vh]">
            <h1 className="h1 mb-4 text-center">API Reference</h1>
            <p className="text-surface-600-400 mb-12 text-center max-w-2xl text-lg">
                Select your preferred interface to interact with the OpenAPI
                specification.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {SCHEMA_OPTIONS.map((schema) => (
                    <Link
                        key={schema.id}
                        href={schema.href}
                        className="card p-8 bg-surface-100-900 border border-surface-200-800 rounded-container flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer shadow-sm min-h-62.5 justify-center"
                    >
                        <div
                            className={`${schema.colorClass} rounded-full w-14 h-14 flex items-center justify-center text-white mb-6`}
                        >
                            <schema.icon className="w-8 h-8 fill-current" />
                        </div>
                        <h2 className="h2 mb-4">{schema.name}</h2>
                        <p className="text-surface-600-400 text-sm">
                            {schema.desc}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
