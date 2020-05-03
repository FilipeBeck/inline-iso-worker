import InlineWorker, { BaseCallback, UnwrappedReturnType } from './InlineWorker'

/**
 * Worker utilizado no ambiente do browser quando o mesmo não suportar WebWorker.
 * @param $Callback Manipulador de execução
 */
export default class FallbackWorker<$Scope, $Callback extends BaseCallback<$Scope>> extends InlineWorker<$Scope, $Callback> {
	/** Instância do worker nativo (não instanciada). */
	protected nativeWorker!: Worker
	
	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<$Callback>): Promise<UnwrappedReturnType<$Callback>> {
		return this.handler.call(this.scope!, ...args)
	}
}