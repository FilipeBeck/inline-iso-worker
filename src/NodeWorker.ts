import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import InlineWorker from './InlineWorker'

// Código executado apenas pelo worker
if (!isMainThread) {
	const code = new Function('...args', workerData)

	parentPort?.on('message', data => {
		const args = JSON.parse(data)
		parentPort?.postMessage(JSON.stringify(code(...args)))
	})

	// @ts-ignore - o código restante é desnecessário no escopo do worker
	return
}

/**
 * Worker utilizado no ambiente Node.
 * @param TCallback Manipulador de execução
 */
export default class NodeWorker<TCallback extends (...args: any[]) => any> extends InlineWorker<TCallback> {
	/**
	 * Construtor
	 * @param handler Callback invocado sempre que executar o worker
	 */
	constructor(handler: TCallback) {
		super(handler)

		const code = `
			const callback = ${this.isNativeCallback && handler.name || handler.toString()}
			return callback(...args)
		`

		this.innerWorker = new Worker(__filename, { workerData: code })
	}

	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.queue((resolve, reject) => {
			this.innerWorker.postMessage(JSON.stringify(args))
			this.innerWorker.on('message', data => resolve(JSON.parse(data)))
			this.innerWorker.on('error', error => reject(error))
			this.innerWorker.on('exit', (code) => {
				if (code !== 0)
					reject(new Error(`Worker stopped with exit code ${code}`))
			})
		})
	}

	/** Instância do worker nativo. */
	private innerWorker: Worker
}