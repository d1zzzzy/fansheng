const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? `${process.env.NEXT_PUBLIC_ASSET_PREFIX}` : '';

export { basePath };
