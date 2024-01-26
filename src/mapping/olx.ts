import OlxMapping from '../interfaces/olx'

const olxMapping: OlxMapping = {
  login: {
    url: '',
    usernameField: '',
    passwordField: '',
    loginButton: '',
  },
  search: {
    baseURL: 'https://www.olx.com.br/estado-am?q=',
    regionsFoundDiv: '//*[@id="main-content"]/div[1]/div/div[2]/div/div',
    resultDataElm: '//*[@id="main-content"]/div[2]/div[1]/p',
    searchResultNum: '/html/body/div[1]/div/main/div[1]/div[2]/main/div[2]/div/p',
    resultItem: {
      ItemContainerElm: '.olx-ad-card',
      coverImgElm: '.olx-image-carousel__item picture img',
      nameElm: '.olx-ad-card__title-link',
      priceElm: '.olx-ad-card__details-price--horizontal h3',
      installmentsElm: '.olx-ad-card__details-price--horizontal .olx-ad-card__priceinfo',
      regionElm: '.olx-ad-card__location-date-container',
      postDateElm: '.olx-ad-card__location p:nth-child(1)',
      alinkElm: '.olx-ad-card__link-wrapper'
    },
  },
  url: 'https://www.olx.com.br/',
  name: 'olx',
  implemented: true,
  needsLogin: false,
}

export default olxMapping
