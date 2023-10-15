import TerabyteMapping from '../interfaces/terabyte'

// https://www.terabyteshop.com.br/busca?str=monitor

const terabyteMapping: TerabyteMapping = {
  search: {
    baseURL: 'https://www.terabyteshop.com.br/busca',
    resultItem: {
      ItemContainerElm: '.pbox',
      coverImgElm: '.commerce_columns_item_image img',
      nameElm: '.prod-name',
      priceElm: '.prod-new-price > span',
      singleInstallmentElm: '.prod-juros span',
      alinkElm: '.prod-name',
      unavailableElm: '.tbt_esgotado'
    },
  },
  url: 'https://www.terabyteshop.com.br',
  name: 'terabyte',
  implemented: true,
  needsLogin: false,
}

export default terabyteMapping
