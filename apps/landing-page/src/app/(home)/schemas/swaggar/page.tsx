'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useApiSpec } from '../ApiSpecContext';

export default function SwaggerPage() {
    const spec = useApiSpec();

    return <SwaggerUI spec={spec} />;
}
