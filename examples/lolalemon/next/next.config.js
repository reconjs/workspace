/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "recon",
    "@reconjs/utils",
    "@reconjs/utils-react",
    "@reconjs/utils-server",
  ]
}

module.exports = nextConfig
