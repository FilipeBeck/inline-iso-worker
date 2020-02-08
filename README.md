# inline-iso-worker

[Versão em português](#[pt-BR])

[![Coverage Status](https://coveralls.io/repos/github/FilipeBeck/inline-iso-worker/badge.svg?branch=master)](https://coveralls.io/github/FilipeBeck/inline-iso-worker?branch=master)

[Isomorfic](https://medium.com/airbnb-engineering/isomorphic-javascript-the-future-of-web-apps-10882b7a2ebc) worker who works with inline callbacks instead of files.

## Installation

`npm install inline-iso-worker`

`yarn add inline-iso-worker`

## Inline worker

Default package export.

### Constructors

```typescript
constructor<TScope, TCallback>(scope: TScope, callback: TCallback)
```

Creates a worker with the specified scope and callabck. The scope will be assigned to the function's lexical `this`. An exception will occur if a _arrow function_ is provided. The rest of the arguments will be the arguments provided to the `run()` method.

```typescript
constructor<TScope>(callback: TCallback)
```

Creates a worker without scope and with the specified callback. An _arrow function_ can also be provided.

### Methods

```typescript
async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>>
```

Performs the callback provided in the constructor with the given arguments and returns the resulting value from the callback.

### Example

```typescript
import InlineWorker from 'inline-iso-worker'

const worker = new InlineWorker({ prefix: 'Hello ', suffix: '. Be welcome', }, function(name: string) {
  return this.prefix + name + this.suffix
})

async someConcurrentFunction() {
  const return1 = await worker.run('Filipe')
  const return2 = await worker.run('Roberto')
  const return3 = await worker.run('Beck')

  console.log(return1) // Prints "Hello Filipe. Be welcome"
  console.log(return2) // Prints "Hello Roberto. Be welcome"
  console.log(return3) // Prints "Hello Beck. Be welcome"
}
```

## Cluster

Handles multiple workers who performs the same callback synchronously.

### Constructors

```typescript
constructor<TScope, TCallback>(scopes: Scope[], callback: TCallback)
```

Creates a cluster containing a worker for each provided scope, all sharing the specified callback.

### Methods

```typescript
async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>[]>
```

Performs the callback provided in the constructor with the provided arguments for each worker and returns an array with the resulting values from each worker.

### Example

```typescript
import { Cluster } from 'inline-iso-worker'

const scopes = [{
  prefix: 'Hello ', suffix: '. Be welcome',
  prefix: 'Bye ', suffix: '',
  preffix: '', suffix: ''
}]

const cluster = new Cluster(scopes, function(name: string) {
  return this.prefix + name + this.suffix
})

async someConcurrentFunction() {
  const [return1, return2, return3] = await cluster.run('Filipe')

  console.log(return1) // Prints "Hello Filipe. Be welcome"
  console.log(return2) // Prints "By Filipe"
  console.log(return3) // Prints "Filipe"
}
```

## __[pt-BR]__

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
