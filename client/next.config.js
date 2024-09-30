/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  //config from https://github.com/gregrickaby/nextjs-github-pages
  /**
   * Enable static exports for the App Router.
   *
   * @see https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
   */
  output: "export",

  /**
   * Set base path. This is usually the slug of your repository.
   *
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/basePath
   */
  basePath: process.env.GITHUB_PAGES==="true" ? "/equine-webapp" : "",

  /**
   * Disable server-based image optimization. Next.js does not support
   * dynamic features with static exports.
   *
   * @see https://nextjs.org/docs/pages/api-reference/components/image#unoptimized
   */
  images: {
    unoptimized: true,
  },
  distDir: process.env.STATIC_BUILD_FOR_SERVER==="true" ? "../src/equine_webapp/client" : undefined
}

module.exports = nextConfig
