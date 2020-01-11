import InlineWorker from './InlineWorker'

/**
 * Worker utilizado no ambiente do browser quando o mesmo não suportar WebWorker.
 * @param TCallback Manipulador de execução
 */
export default class FakeWorker<TCallback extends (...args: any[]) => any> extends InlineWorker<TCallback> {
	/**
	 * Executa o manipulador com os argumentos especificados.
	 * @param args Argumentos fornecidos ao manipulador de execução.
	 * @return Promessa com o valor de retorno do manipulador.
	 */
	public async run(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>> {
		return this.handler(...args)
	}
}