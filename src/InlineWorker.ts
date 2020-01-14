/**
 * Worker que executa callbacks inline ao invés de arquivos externos utilizando serialização de funções e protocolo `data://` para carregar o código.
 * @param TCallback Manipulador de execução.
 * @param TScope Variáveis disponíveis no escopo do worker.
 */
export default abstract class InlineWorker<TCallback extends (...args: any[]) => any, TScope extends object> {
	/** Manipulador de execução. */
	protected handler: TCallback

	/** Variáveis disponíveis no escopo do worker. */
	protected scope?: TScope

	/** Verifica se o manipulador é uma função nativa, como `eval` ou `parseInt`, por exemplo. */
	protected get isNativeCallback(): boolean {
		return /{[\s\n]*\[native code\][\s\n]*}$/.test(this.handler.toString())
	}

	/**
	 * Construtor.
	 * @param handler Callback invocado sempre que executar o worker.
	 * @param scope Variáveis disponíveis no escopo do worker.
	 */
	constructor(handler: TCallback, scope?: TScope) {
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
	public abstract terminate(): void

	/**
	 * Cria o código que o worker irá carregar e executar.
	 * @param isBrowser Determina se deve gerar código para ambiente Node ou Browser.
	 */
	protected createSerializedRunner(isBrowser: boolean): string {
		// Pequenas variações entre Node e Browser
		const [protocolPrefix, messageArgument, parserArgument, parent, listenMethod] = isBrowser && [
			'data://utf8; application/javascript,', 'event', 'event.data', 'self', 'addEventListener'
		] || [
			'', 'data', 'data', 'parentPort', 'on'
		]

		return `${protocolPrefix}
			const callback = ${this.isNativeCallback && this.handler.name || this.handler.toString()}
			const scope = ${JSON.stringify(this.scope)}

			function messageHandler(${messageArgument}) {
				const args = JSON.parse(${parserArgument})
				const returnValue = callback(...args)

				${parent}.postMessage(JSON.stringify(returnValue))
			}

			${parent}.${listenMethod}('message', messageHandler.bind(scope))
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

	/** Última promessa criada por `queue`. */
	private lastQueuedPromise?: Promise<ReturnType<TCallback>>
}