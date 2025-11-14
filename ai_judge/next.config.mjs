/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Ensure outputFileTracingRoot points to the project root (this repository folder)
  // which avoids Next inferring the wrong workspace root when multiple lockfiles exist.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
