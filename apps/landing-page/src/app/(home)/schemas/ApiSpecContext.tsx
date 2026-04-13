'use client';

import { createContext, useContext, ReactNode } from 'react';

const ApiSpecContext = createContext<Object | null>(null);

export function ApiSpecProvider({
    spec,
    children,
}: {
    spec: Object;
    children: ReactNode;
}) {
    return (
        <ApiSpecContext.Provider value={spec}>
            {children}
        </ApiSpecContext.Provider>
    );
}

export function useApiSpec() {
    return useContext(ApiSpecContext);
}
