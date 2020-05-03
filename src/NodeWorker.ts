import { Worker } from 'worker_threads'
import InlineWorker, { WorkerMessage, BaseCallback, UnwrappedReturnType } from './InlineWorker'

/**
 * Worker utilizado no ambiente Node.
 * @param $Scope Variáveis disponíveis no escopo do worker.
 * @param $Callback Manipulador de execução.
 */
export default class NodeWorker<$Scope, $Callback extends BaseCallback<$Scope>> extends InlineWorker<$Scope, $Callback> {
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

		const code = this.createSerializedRunner(false)

		this.innerWorker = new Worker(code, { eval: true })
		this.innerWorker.postMessage(JSON.stringify(this.scope))
		this.innerWorker.postMessage(this.isNativeCallback && this.handler.name || this.handler.toString())
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public run(...args: Parameters<$Callback>): Promise<UnwrappedReturnType<$Callback>> {
		return this.queue((resolve, reject) => {
			const messageHandler = (data: string) => {
				removeListeners()

				const workerMessage = JSON.parse(data) as WorkerMessage

				if (!workerMessage.isError) {
					resolve(workerMessage.data as UnwrappedReturnType<$Callback>)
				}
				else {
					reject(new Error(workerMessage.data as string))
				}
			}

			const errorHandler = (error: Error) => {
				removeListeners()
				reject(error)
			}

			const exitHandler = (code: number) => {
				removeListeners()
				if (code !== 0) {
					reject(new Error(`Worker stopped with exit code ${code}`))
				}
			}

			const removeListeners = () => {
				this.innerWorker.off('message', messageHandler)
				this.innerWorker.off('error', errorHandler)
				this.innerWorker.off('exit', exitHandler)
			}

			this.innerWorker.on('message', messageHandler)
			this.innerWorker.on('error', errorHandler)
			this.innerWorker.on('exit', exitHandler)

			this.innerWorker.postMessage(JSON.stringify(args))
		})
	}

	public terminate(): void {
		this.innerWorker.terminate()
	}
}