import postcssLogical from 'postcss-logical';

export default {
  plugins: [
    postcssLogical({
      dir: 'ltr',
    }),
  ],
};
