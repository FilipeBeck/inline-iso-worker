import InlineWorker from './InlineWorker'

/**
 * Worker utilizado no ambiente do browser.
 * @param TCallback Manipulador de execução
 */
export default class BrowserWorker<TCallback extends (...args: any[]) => any> extends InlineWorker<TCallback> {
	/**
	 * Construtor
	 * @param handler Callback invocado sempre que executar o worker
	 */
	constructor(callback: TCallback) {
		super(callback)

		const code = `data://utf8; application/javascript,
			const callback = ${this.isNativeCallback && callback.name || callback.toString()}

			self.onmessage = function(event) {
				const args = JSON.parse(event.data)
				self.postMessage(JSON.stringify(callback(...args)))
			}
		`

		this.innerWorker = new Worker(code)
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.queue((resolve, reject) => {
			this.innerWorker.onmessage = event => resolve(JSON.parse(event.data))
			this.innerWorker.onerror = event => reject(event.error)
			this.innerWorker.postMessage(JSON.stringify(args))
		})
	}

	/** Instância do worker nativo. */
	private innerWorker: Worker
}