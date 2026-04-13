'use client';

import 'swagger-ui-react/swagger-ui.css';
import SwaggerUI from 'swagger-ui-react';
import { useApiSpec } from '../ApiSpecContext';

export default function SwaggerPage() {
    const spec = useApiSpec();

    return <SwaggerUI spec={spec} />;
}
