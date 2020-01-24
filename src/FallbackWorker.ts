import InlineWorker from './InlineWorker'

/**
 * Worker utilizado no ambiente do browser quando o mesmo não suportar WebWorker.
 * @param TCallback Manipulador de execução
 */
export default class FallbackWorker<TScope, TCallback extends (this: TScope, ...args: any[]) => any> extends InlineWorker<TScope, TCallback> {
	/** Instância do worker nativo (não instanciada). */
	protected innerWorker!: Worker
	
	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.handler.call(this.scope!, ...args)
	}
}