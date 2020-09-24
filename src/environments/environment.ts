// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  platformAcc: 'ttplatform',
  walletUrl: 'https://walleteos.com',
  votingUrl: 'https://eosportal.io',
  appName: 'DAO Tracker',
  logoUrl: '/assets/logo.png',
  blockchainUrl: 'https://api.daobet.org',
  chainId: '4520bb15de39f4092ed02018139068312ce4a728fbe17eadde2be0be2074ad41',
  tokensUrl: 'https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json',
  tickerUrl: 'https://api.coinmarketcap.com/v2/ticker/1765/',
  token: 'BET'
};
