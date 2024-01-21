import TerabyteMapping from '../interfaces/terabyte'

// https://www.pichau.com.br/search?q=pc%20gamer
// exibe 36 itens por pagina

const terabyteMapping: TerabyteMapping = {
  search: {
    baseURL: 'https://www.pichau.com.br/search',
    resultItem: {
      ItemContainerElm: '.MuiGrid-root .MuiGrid-container .MuiGrid-item',
      coverImgElm: 'img',
      nameElm: '.MuiTypography-root',
      priceElm: '.MuiCardContent-root div',
      singleInstallmentElm: '.prod-juros span',
      alinkElm: '.prod-name',
      unavailableElm: '.tbt_esgotado'
    },
  },
  url: 'https://www.pichau.com.br',
  name: 'pichau',
  implemented: true,
  needsLogin: false,
}

export default terabyteMapping
