import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import InlineWorker, { WorkerMessage, BaseCallback } from './InlineWorker'

// Código executado apenas pelo worker
if (!isMainThread) {
	new Function('parentPort', workerData)(parentPort)
	// @ts-ignore - o código restante é desnecessário no escopo do worker
	return
}

/**
 * Worker utilizado no ambiente Node.
 * @param TScope Variáveis disponíveis no escopo do worker.
 * @param TCallback Manipulador de execução.
 */
export default class NodeWorker<TScope, TCallback extends BaseCallback<TScope>> extends InlineWorker<TScope, TCallback> {
	/** Instância do worker nativo. */
	protected innerWorker: Worker

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
	constructor(...args: any[]) {
		super(args[0], args[1])

		const code = this.createSerializedRunner(false)

		this.innerWorker = new Worker(__filename, { workerData: code })
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.queue((resolve, reject) => {
			const messageHandler = (data: string) => {
				removeListeners()

				const workerMessage = JSON.parse(data) as WorkerMessage

				if (!workerMessage.isError) {
					resolve(workerMessage.data)
				}
				else {
					reject(new Error(workerMessage.data))
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