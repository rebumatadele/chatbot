// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     webpack(config, { isServer }) {
//         // Ensure that Node.js built-in modules are not bundled by Webpack
//         if (isServer) {
//             config.externals = [
//                 ...config.externals,
//                 'fs',
//                 'path',
//                 'pdf-parse',
//                 // Add other modules if necessary
//             ];
//         }
//         return config;
//     },
//     // Optional: Add other Next.js configuration settings here
// };

// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     webpack(config, { isServer }) {
//         // Handle Node.js built-in modules
//         if (isServer) {
//             config.externals = [
//                 ...config.externals,
//                 'fs',
//                 'path',
//                 'pdf-parse',
//             ];
//         }

//         // Add aliases to resolve issues with specific modules
//         config.resolve.alias = {
//             ...config.resolve.alias,
//             '@langchain/core': path.resolve(__dirname, 'node_modules/@langchain/core'),
//             // Add other aliases if necessary
//         };

//         // Fix for the langchain module resolution
//         config.module.rules.push({
//             test: /node_modules\/langchain/,
//             resolve: {
//                 fullySpecified: false,
//             },
//         });

//         return config;
//     },
// };

// export default nextConfig;




import path from 'path';
import { fileURLToPath } from 'url';

// Determine the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
        // Handle Node.js built-in modules
        if (isServer) {
            config.externals = [
                ...config.externals,
                'fs',
                'path',
                'pdf-parse',
            ];
        }

        // Add aliases to resolve issues with specific modules
        config.resolve.alias = {
            ...config.resolve.alias,
            '@langchain/core': path.resolve(__dirname, 'node_modules/@langchain/core'),
            // Add other aliases if necessary
        };

        // Disable tree shaking
        config.optimization = {
            ...config.optimization,
            usedExports: false,
            minimize: false,  // Optionally disable code minimization as well
        };

        return config;
    },
};

export default nextConfig;
