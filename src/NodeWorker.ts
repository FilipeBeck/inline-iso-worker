import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import InlineWorker from './InlineWorker'

// Código executado apenas pelo worker
if (!isMainThread) {
	new Function('parentPort', workerData)(parentPort)
	// @ts-ignore - o código restante é desnecessário no escopo do worker
	return
}

/**
 * Worker utilizado no ambiente Node.
 * @param TCallback Manipulador de execução.
 * @param TScope Variáveis disponíveis no escopo do worker.
 */
export default class NodeWorker<TCallback extends (...args: any[]) => any, TScope extends object> extends InlineWorker<TCallback, TScope> {
	/**
	 * Construtor.
	 * @param handler Callback invocado sempre que executar o worker.
	 * @param scope Variáveis disponíveis no escopo do worker.
	 */
	constructor(handler: TCallback, scope?: TScope) {
		super(handler, scope)

		const code = this.createSerializedRunner(false)

		this.innerWorker = new Worker(__filename, { workerData: code })
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.queue((resolve, reject) => {
			const messageHandler = (data: string) => {
				removeListeners()
				resolve(data !== undefined && JSON.parse(data) || undefined)
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

	/** Instância do worker nativo. */
	private innerWorker: Worker
}