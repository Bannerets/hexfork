import path from 'path';
import { Configuration, DefinePlugin } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import { commitRef } from './src/server/lastCommitInfo';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

import { IS_DEV, WEBPACK_PORT } from './src/server/config';

const plugins = [
    new WebpackManifestPlugin({}),
    new VueLoaderPlugin(),
    new DefinePlugin({
        LAST_COMMIT_DATE: JSON.stringify(commitRef.date),
        SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN ?? null),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false,
    }),
];

const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;

if (SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT) {
    // Put the Sentry Webpack plugin after all other plugins
    plugins.push(sentryWebpackPlugin({
        authToken: SENTRY_AUTH_TOKEN,
        org: SENTRY_ORG,
        project: SENTRY_PROJECT,
    }));
}

// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
// plugins.push(new BundleAnalyzerPlugin());

const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const targets = IS_DEV ? { chrome: '79', firefox: '72' } : '> 0.25%, not dead';

const devServer: DevServerConfiguration = {
    port: WEBPACK_PORT,
    open: `http://localhost:${process.env.PORT || 3000}`,
    allowedHosts: ['all'],
};

const config: Configuration = {
    mode: process.env.NODE_ENV as 'development' | 'production',
    devtool: IS_DEV ? 'inline-source-map' : 'source-map',
    entry: ['./src/client/client'],
    output: {
        path: path.join(__dirname, 'dist', 'statics'),
        filename: `[name]-[chunkhash]-bundle.js`,
        chunkFilename: '[name]-[chunkhash]-bundle.js',
        publicPath: '/statics/',
    },
    resolve: {
        extensions: ['.js', '.ts'],
        alias: {
            '@client': path.resolve(__dirname, 'src/client/'),
            '@server': path.resolve(__dirname, 'src/server/'),
            '@shared': path.resolve(__dirname, 'src/shared/'),
        },
    },
    optimization: {
        minimize: !IS_DEV,
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10,
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.ts$/,
                exclude: [/node_modules/, nodeModulesPath],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/env', { modules: false, targets }], '@babel/typescript'],
                            plugins: [
                                '@babel/proposal-numeric-separator',
                                '@babel/plugin-transform-runtime',
                                ['@babel/plugin-proposal-decorators', { legacy: true }],
                                ['@babel/plugin-proposal-class-properties'],
                                '@babel/plugin-proposal-object-rest-spread',
                            ],
                        },
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            appendTsSuffixTo: [/\.vue$/],
                            transpileOnly: true,
                        },
                    },
                ],
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.styl(us)?$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'stylus-loader',
                ],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/inline',
            },
        ],
    },
    devServer,
    plugins,
};

export default config;
