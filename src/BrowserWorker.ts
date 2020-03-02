import InlineWorker, { WorkerMessage, BaseCallback, UnwrappedReturnType } from './InlineWorker'

/**
 * Worker utilizado no ambiente do browser.
 * @param $Scope Variáveis disponíveis no escopo do worker.
 * @param $Callback Manipulador de execução
 */
export default class BrowserWorker<$Scope, $Callback extends BaseCallback<$Scope>> extends InlineWorker<$Scope, $Callback> {
	/** Instância do worker nativo. */
	protected innerWorker: Worker

	/**
	 * Construtor.
	 * @param scope Variáveis disponíveis no escopo do worker.
	 * @param handler Callback invocado sempre que executar o worker.
	 */
	constructor(scope: $Scope, handler: $Callback)

	/**
	 * Construtor.
	 * @param handler Callback invocado sempre que executar o worker.
	 */
	constructor(handler: $Callback)

	/**
	 * Construtor.
	 */
	constructor(...args: any[]) {
		super(args[0], args[1])

		const code = this.createSerializedRunner(true)

		this.innerWorker = new Worker(code)
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public run(...args: Parameters<$Callback>): Promise<UnwrappedReturnType<$Callback>> {
		return this.queue((resolve, reject) => {
			const handleMessage = (event: MessageEvent) => {
				removeListeners()

				const workerMessage = JSON.parse(event.data) as WorkerMessage

				if (!workerMessage.isError) {
					resolve(workerMessage.data as UnwrappedReturnType<$Callback>)
				}
				else {
					reject(new Error(workerMessage.data as string))
				}
			}

			const handleError = (event: ErrorEvent) => {
				removeListeners()
				reject(event.error)
			}

			const removeListeners = () => {
				this.innerWorker.removeEventListener('message', handleMessage)
				this.innerWorker.removeEventListener('error', handleError)
			}

			this.innerWorker.addEventListener('message', handleMessage)
			this.innerWorker.addEventListener('error', handleError)

			this.innerWorker.postMessage(JSON.stringify(args))
		})
	}
}