import InlineWorker from './InlineWorker'

/**
 * Worker utilizado no ambiente do browser.
 * @param TCallback Manipulador de execução
 * @param TScope Variáveis disponíveis no escopo do worker.
 */
export default class BrowserWorker<TCallback extends (...args: any[]) => any, TScope extends object> extends InlineWorker<TCallback, TScope> {
	/**
	 * Construtor.
	 * @param handler Callback invocado sempre que executar o worker.
	 * @param scope Variáveis disponíveis no escopo do worker.
	 */
	constructor(callback: TCallback, scope?: TScope) {
		super(callback, scope)

		const code = this.createSerializedRunner(true)

		this.innerWorker = new Worker(code)
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.queue((resolve, reject) => {
			const messageHandler = (event: MessageEvent) => {
				removeListeners()
				resolve(event.data !== undefined && JSON.parse(event.data) || undefined)
			}

			const errorHandler = (event: ErrorEvent) => {
				removeListeners()
				reject(event.error)
			}

			const removeListeners = () => {
				this.innerWorker.removeEventListener('message', messageHandler)
				this.innerWorker.removeEventListener('error', errorHandler)
			}

			this.innerWorker.addEventListener('error', errorHandler)
			this.innerWorker.addEventListener('message', messageHandler)

			this.innerWorker.postMessage(JSON.stringify(args))
		})
	}

	/**
	 * Encerra o worker imediatamente, independentemente do worker ter concluido alguma operação em andamento.
	 */
	public terminate(): void {
		this.innerWorker.terminate()
	}

	/** Instância do worker nativo. */
	private innerWorker: Worker
}