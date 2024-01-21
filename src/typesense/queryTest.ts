import { typesenseCliFactory } from './cli'

const query = (termo: string) => {
  const parameters = {
    q: termo,
    query_by: 'nome',
    sort_by: 'avista:asc',
  }

  const cli = typesenseCliFactory()

  return cli
    .collections('produtos')
    .documents()
    .search(parameters)
    .then(function (searchResults) {
      return searchResults.hits
    })
}

const exec = async () => {
  const termo = process.argv[2]
  if (!termo) throw new Error('Preciso de um termo pra buscar')

  const results = await query(termo)
  console.log(results)
}

;(() => exec())()
