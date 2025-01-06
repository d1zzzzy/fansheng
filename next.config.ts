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
  experimental: {
    turbo: {
      rules: {
        '*.vert': {
          loaders: ['raw-loader'],
          as: '*.js'
        },
        '*.frag': {
          loaders: ['raw-loader'],
          as: '*.js'
        },
        '*.wgsl': {
          loaders: ['raw-loader'],
          as: '*.js'
        },
        '*.glsl': {
          loaders: ['raw-loader'],
          as: '*.js'
        }
      }
    }
  }
};
