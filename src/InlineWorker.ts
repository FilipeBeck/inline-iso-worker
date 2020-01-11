/**
 * Worker que executa callbacks inline ao invés de arquivos externos utilizando serialização de funções e protocolo `data://` para carregar o código.
 * @param TCallback Manipulador de execução
 */
export default abstract class InlineWorker<TCallback extends (...args: any[]) => any> {
	/** Manipulador de execução. */
	protected handler: TCallback

	/** Verifica se o manipulador é uma função nativa, como `eval` ou `parseint`, por exemplo. */
	protected get isNativeCallback(): boolean {
		return /{[\s\n]*\[native code\][\s\n]*}$/.test(this.handler.toString())
	}

	/**
	 * Construtor
	 * @param handler Callback invocado sempre que executar o worker
	 */
	constructor(handler: TCallback) {
		this.handler = handler
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public abstract async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>>

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

	/** Última promessa criado por `queue`. */
	private lastQueuedPromise?: Promise<ReturnType<TCallback>>
}