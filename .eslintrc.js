const { version: reactVersion } = require('react/package.json')

module.exports = {
  extends: ['react-app', 'next/core-web-vitals'],
  settings: { react: { version: reactVersion } },
  rules: {
    '@next/next/no-img-element': 'off',
    'jsx-a11y/anchor-is-valid': ['off'],
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
  },
}
