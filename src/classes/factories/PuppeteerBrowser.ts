import puppeteer from 'puppeteer'

export const PuppeteerBrowser = () =>
  puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: [`--window-size=${1000},${1000}`],
    defaultViewport: {
      width: 1000,
      height: 10000,
    },
  })
