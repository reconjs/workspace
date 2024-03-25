/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@reconjs/utils",
    "@reconjs/utils-react",
    "@reconjs/utils-server",
    "@reconjs/core",
    "@reconjs/react",
    "@reconjs/server",
  ]
}

module.exports = nextConfig
