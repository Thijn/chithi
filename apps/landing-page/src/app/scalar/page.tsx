'use client';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import { OPENAPI_URL } from '@/consts/urls';
import '@scalar/api-reference-react/style.css';

export default function References() {
    return (
        <ApiReferenceReact
            configuration={{
                url: OPENAPI_URL,
            }}
        />
    );
}
