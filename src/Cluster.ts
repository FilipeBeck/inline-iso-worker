import Worker from './index'
import InlineWorker, { BaseCallback, UnwrappedReturnType } from './InlineWorker'

/**
 * 🇺🇸 Handles a group of workers that performs the same function synchronously.
 * 
 * 🇧🇷 Manipula grupo de workers que executam a mesma função de forma sincronizada.
 */
export default class Cluster<$Scope, $Callback extends BaseCallback<$Scope>> {
	private workers: InlineWorker<$Scope, $Callback>[]

	/** Última promessa criada por `queue`. */
	private lastQueuedPromise?: Promise<UnwrappedReturnType<$Callback>[]>

	/**
	 * 🇺🇸 Constructor.
	 * 
	 * 🇧🇷 Construtor.
	 * 
	 * @param scopes 🇺🇸 List of scopes available for each worker. Will be created a worker for each scope. 🇧🇷 Lista de escopos disponíveis para cada worker. Será criado um worker para cada escopo.
	 * @param handler 🇺🇸 Callback executed for each worker. 🇧🇷 Callback executado por cada worker.
	 */
	constructor(scopes: $Scope[], handler: $Callback) {
		if (!scopes.length) {
			throw new Error('Argument `scopes` cannot be empty')
		}

		this.workers = scopes.map(scope => new Worker(scope, handler))
	}

	/**
	 * 🇺🇸 Executes the handler with the specified arguments for each worker.
	 * 
	 * 🇧🇷 Executa o manipulador com os argumentos especificados para cada worker.
	 * 
	 * @param args 🇺🇸 Arguments provided to execution handler. 🇧🇷 Argumentos fornecidos ao manipulador de execução.
	 * @return 🇺🇸 Promise with the return values from the handler of each worker. 🇧🇷 Promessa com os valores de retorno do manipulador de cada worker.
	 */
	public async run(...args: Parameters<$Callback>): Promise<UnwrappedReturnType<$Callback>[]> {
		return this.queue(...args)
	}

	/**
	 * 🇺🇸 Finish the workers immediately, regardless of wheter they have completed an operation in progress.
	 * 
	 * 🇧🇷 Encerra os workers imediatamente, independente de terem concluido alguma operação em andamento.
	 */
	public terminate(): void {
		for (const worker of this.workers) {
			worker.terminate()
		}
	}


	/**
	 * Sincroniza a execução de `handler` com os demais em andamento, evitando sobrescrita de entrada/saida nas trocas de mensagens.
	 * @param args Argumentos a serem enfileirados.
	 */
	protected async queue(...args: Parameters<$Callback>): Promise<UnwrappedReturnType<$Callback>[]> {
		const nextQueuedPromise = Promise.resolve(this.lastQueuedPromise).then(() => {
			return Promise.all(this.workers.map(worker => worker.run(...args)))
		})

		return this.lastQueuedPromise = nextQueuedPromise
	}
}