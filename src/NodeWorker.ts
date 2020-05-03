import { Worker as NativeNodeWorker } from 'worker_threads'
import InlineWorker, { WorkerMessage, BaseCallback, UnwrappedReturnType } from './InlineWorker'

/**
 * Worker utilizado no ambiente Node.
 * @param $Scope Variáveis disponíveis no escopo do worker.
 * @param $Callback Manipulador de execução.
 */
export default class NodeWorker<$Scope, $Callback extends BaseCallback<$Scope>> extends InlineWorker<$Scope, $Callback> {
	/** Instância do worker nativo. */
	protected nativeWorker: NativeNodeWorker

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

		this.nativeWorker = new NativeNodeWorker(code, { eval: true })
		this.nativeWorker.postMessage(JSON.stringify(this.scope))
		this.nativeWorker.postMessage(this.isNativeCallback && this.handler.name || this.handler.toString())
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
				this.nativeWorker.off('message', messageHandler)
				this.nativeWorker.off('error', errorHandler)
				this.nativeWorker.off('exit', exitHandler)
			}

			this.nativeWorker.on('message', messageHandler)
			this.nativeWorker.on('error', errorHandler)
			this.nativeWorker.on('exit', exitHandler)

			this.nativeWorker.postMessage(JSON.stringify(args))
		})
	}

	public terminate(): void {
		this.nativeWorker.terminate()
	}
}