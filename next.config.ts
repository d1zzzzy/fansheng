import { resolve } from "path";

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'fansheng';

module.exports = {
  output: 'export',
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  images: {
    unoptimized: true,
  },
  sassOptions: {
    includePaths: [resolve(__dirname, 'styles')],
  },
};
