import { Worker as NodeWorker } from 'worker_threads'

/**
 * Interface instanciadora dos workers.
 */
export interface WorkerConstructor {
	/**
	 * Construtor com escopo.
	 * @param scope Variáveis disponíveis no escopo do worker.
	 * @param handler Callback invocado sempre que executar o worker.
	 */
	new <TScope, TCallback extends BaseCallback<TScope>>(scope: TScope, callback: TCallback): InlineWorker<TScope, TCallback>

	/**
	 * Construtor sem escopo.
	 * @param handler Callback invocado sempre que executar o worker.
	 */
	new <TCallback extends BaseCallback>(callback: TCallback): InlineWorker<undefined, TCallback>
}

/** Callback base. */
export type BaseCallback<TScope = undefined> = (this: TScope, ...args: any[]) => any

/**
 * @internal
 * Estrutura das mensagens trocadas internamente.
 */
export interface WorkerMessage {
	/** Dados de uma mensagem bem sucedida ou texto de uma mensagem de error. */
	data: any
	/** Determina se é uma mensagem bem sucedida ou erro. */
	isError: boolean
}

/** Alias para worker do browser. */
type BrowserWorker = Worker

/**
 * Worker que executa callbacks inline ao invés de arquivos externos utilizando serialização de funções e protocolo `data://` para carregar o código.
 * @param TScope Variáveis disponíveis no escopo do worker.
 * @param TCallback Manipulador de execução.
 */
export default abstract class InlineWorker<TScope, TCallback extends BaseCallback<TScope>> {
	/** Variáveis disponíveis no escopo do worker. */
	protected scope?: TScope

	/** Manipulador de execução. */
	protected handler: TCallback

	/** Instância do worker nativo. */
	protected abstract innerWorker: BrowserWorker | NodeWorker

	/** Determina se o manipulador é uma função nativa, como `eval` ou `parseInt`, por exemplo. */
	protected get isNativeCallback(): boolean {
		return /{[\s\n]*\[native code\][\s\n]*}$/.test(this.handler.toString())
	}

	/** Última promessa criada por `queue`. */
	private lastQueuedPromise?: Promise<ReturnType<TCallback>>

	/**
	 * Construtor.
	 * @param scope Variáveis disponíveis no escopo do worker.
	 * @param handler Callback invocado sempre que executar o worker.
	 */
	constructor(scope: TScope, handler: TCallback)

	/**
	 * Construtor.
	 * @param handler Callback invocado sempre que executar o worker.
	 */
	constructor(handler: TCallback)

	/**
	 * Construtor.
	 */
	constructor(...args: unknown[]) {
		const [handler, scope] = typeof args[0] == 'function' ? [args[0] as TCallback, undefined] : [args[1] as TCallback, args[0] as TScope]

		if (scope && !handler.toString().startsWith('function')) {
			throw new Error('Arrow function not allowed when providing scope')
		}

		this.handler = handler
		this.scope = scope
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public abstract async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>>

	/**
	 * Encerra o worker imediatamente, independentemente do worker ter concluido alguma operação em andamento.
	 */
	public terminate(): void {
		this.innerWorker.terminate()
	}

	/**
	 * Cria o código que o worker irá carregar e executar.
	 * @param isBrowser Determina se deve gerar código para ambiente Node ou Browser.
	 */
	protected createSerializedRunner(isBrowser: boolean): string {
		// Pequenas variações entre Node e Browser
		const [protocolOrRequirePrefix, messageArgument, parserArgument, parent, listenMethod] = isBrowser && [
			'data://utf8; application/javascript,', 'event', 'event.data', 'self', 'addEventListener'
		] || [
			'const { parentPort } = require("worker_threads")', 'data', 'data', 'parentPort', 'on'
		]

		return `${protocolOrRequirePrefix}
			const scope = ${JSON.stringify(this.scope)}
			const callback = (${this.isNativeCallback && this.handler.name || this.handler.toString()}).bind(scope)

			function handleMessage(${messageArgument}) {
				try {
					const args = JSON.parse(${parserArgument})
					const returnValue = { data: callback(...args), error: false }
					
					${parent}.postMessage(JSON.stringify(returnValue))
				}
				catch (error) {
					const errorValue = { data: error.message || error.stack || error, isError: true }

					${parent}.postMessage(JSON.stringify(errorValue))
				}
			}

			${parent}.${listenMethod}('message', handleMessage)
		`
	}

	/**
	 * Sincroniza a execução de `handler` com os demais em andamento, evitando sobrescrita de entrada/saida nas trocas de mensagens.
	 * @param handler Callback a ser enfileirado.
	 */
	protected async queue(handler: (resolve: (value: ReturnType<TCallback>) => void, reject: (error: Error) => void) => void): Promise<ReturnType<TCallback>> {
		const nextPromise = new Promise<ReturnType<TCallback>>(async (resolve, reject) => {
			await this.lastQueuedPromise
			handler(resolve, reject)
		})

		return this.lastQueuedPromise = nextPromise
	}
}