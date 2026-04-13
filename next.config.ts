import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import {NextConfig} from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-gfm', {}]],
    rehypePlugins: [['rehype-prism-plus', {}]],
  },
});

export default withMDX(nextConfig);