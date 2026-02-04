/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    test: {
        // Vitest configuration options
        include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
});
