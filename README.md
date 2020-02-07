# inline-iso-worker

[![Coverage Status](https://coveralls.io/repos/github/FilipeBeck/inline-iso-worker/badge.svg?branch=master)](https://coveralls.io/github/FilipeBeck/inline-iso-worker?branch=master)

Worker [isomórfico](https://medium.com/pensamentos-js/um-futuro-chamado-javascript-isomorfico-fa43af60d132) que trabalha com callbacks inline no lugar de arquivos.

## Instalação

`npm install inline-iso-worker`

`yarn add inline-iso-worker`

## Inline worker

Exportação default do pacote.

### Construtores

```typescript
constructor<TScope, TCallback>(scope: TScope, callback: TCallback)
```

Cria um Worker com o escopo e callback especificados. O escopo será atribuido ao `this` léxico da função. Ocorrerá uma exceção se uma _arrow function_ for fornecida. Os demais argumentos serão os argumentos fornecidos ao método `run()`.

```typescript
constructor<TScope>(callback: TCallback)
```

Cria um worker sem escopo e com o callback especificado. Uma _arrow function_ também pode ser fornecida.

### Métodos

```typescript
async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>>
```

Executa o callback fornecido no construtor com os argumentos fornecidos e retorna o valor resultante do callback.

### Exemplo

```typescript
import InlineWorker from 'inline-iso-worker'

const worker = new InlineWorker({ prefix: 'Olá ', suffix: '. Seja bem vindo', }, function(name: string) {
  return this.prefix + name + this.suffix
})

async someConcurrentFunction() {
  const return1 = await worker.run('Filipe')
  const return2 = await worker.run('Roberto')
  const return3 = await worker.run('Beck')

  console.log(return1) // Imprime "Olá Filipe. Seja bem vindo"
  console.log(return2) // Imprime "Olá Roberto. Seja bem vindo"
  console.log(return3) // Imprime "Olá Beck. Seja bem vindo"
}
```

## Cluster

Manipula múltiplos workers que executam o mesmo callback de forma sincronizada.

### Construtores

```typescript
constructor<TScope, TCallback>(scopes: Scope[], callback: TCallback)
```

Cria um Cluster contendo um worker para cada escopo fornecido, todos compartilhando o callback especificado.

### Métodos

```typescript
async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>[]>
```

Executa o callback fornecido no construtor com os argumentos fornecidos para cada worker e retorna um array com os valores resultantes de cada worker.

### Exemplo

```typescript
import { Cluster } from 'inline-iso-worker'

const scopes = [{
  prefix: 'Olá ', suffix: '. Seja bem vindo',
  prefix: 'Tchau ', suffix: '',
  preffix: '', suffix: ''
}]

const cluster = new Cluster(scopes, function(name: string) {
  return this.prefix + name + this.suffix
})

async someConcurrentFunction() {
  const [return1, return2, return3] = await cluster.run('Filipe')

  console.log(return1) // Imprime "Olá Filipe. Seja bem vindo"
  console.log(return2) // Imprime "Tchau Filipe"
  console.log(return3) // Imprime "Filipe"
}
```
