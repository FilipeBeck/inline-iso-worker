import Worker from './index'
import InlineWorker, { BaseCallback } from './InlineWorker'

/**
 * Manipula grupo de workers que executam a mesma função de forma sincronizada.
 */
export default class Cluster<TScope, TCallback extends BaseCallback<TScope>> {
	private workers: InlineWorker<TScope, TCallback>[]

	/** Última promessa criada por `queue`. */
	private lastQueuedPromise?: Promise<ReturnType<TCallback>[]>

	/**
	 * Construtor.
	 * @param scopes Lista de escopos disponíveis para cada worker. Será criado um worker para cada escopo.
	 * @param callback Callback executado por cada worker.
	 */
	constructor(scopes: TScope[], callback: TCallback) {
		if (!scopes.length) {
			throw new Error('Argument `scopes` cannot be empty')
		}

		this.workers = scopes.map(scope => new Worker(scope, callback))
	}

	/**
	 * Executa o manipulador com os argumentos especificados para cada worker.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com os valores de retorno do manipulador de cada worker.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>[]> {
		return this.queue(...args)
	}

	/**
	 * Sincroniza a execução de `handler` com os demais em andamento, evitando sobrescrita de entrada/saida nas trocas de mensagens.
	 * @param handler Callback a ser enfileirado.
	 */
	protected async queue(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>[]> {
		const nextQueuedPromise = Promise.resolve(this.lastQueuedPromise).then(() => {
			return Promise.all(this.workers.map(worker => worker.run(...args)))
		})

		return this.lastQueuedPromise = nextQueuedPromise
	}
}