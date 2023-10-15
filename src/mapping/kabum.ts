import KabumMapping from '../interfaces/kabum'

// https://www.kabum.com.br/busca/3080?page_number=1&page_size=100&facet_filters=&sort=most_searched

const kabumMapping: KabumMapping = {
  search: {
    baseURL: 'https://www.kabum.com.br/busca/',
    resultDataElm: '#listingCount b',
    resultItem: {
      ItemContainerElm: '.productCard',
      coverImgElm: '.imageCard',
      nameElm: '.nameCard',
      priceElm: '.priceCard',
      installmentsElm: '',
      alinkElm: '.productLink',
      availableElm: '.availableFooterCard',
      unavailableElm: '.unavailableFooterCard'
    },
  },
  url: 'https://www.kabum.com.br',
  name: 'olx',
  implemented: true,
  needsLogin: false,
}

export default kabumMapping
