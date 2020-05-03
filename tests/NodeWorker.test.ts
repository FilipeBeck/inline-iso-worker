import NodeWorker from '../src/NodeWorker'

describe('Métdodo run()', () => {
	test('propagação de exceções dentro do callback', async () => {
		expect.assertions(1)

		let message: string

		const worker = new NodeWorker(() => {
			throw new Error('throwed')
		})

		try {	
			await worker.run()
			message = 'not-throwed'
		}
		catch (error) {
			message = error.message
		}
		finally {
			worker.terminate()
		}

		expect(message).toBe('throwed')
	})

	test('valor de retorno para callbacks não-nativos', async () => {
		expect.assertions(1)

		const worker = new NodeWorker(function (...args: number[]) {
			return args.map(arg => arg * 2)
		})

		const parameters = [
			[1, 2, 4, 8],
			[10, 20, 40, 80],
			[1, 3, 9, 27],
			[10, 30, 90, 270]
		]

		const evaluations = await Promise.all(parameters.map(parameter => worker.run(...parameter)))

		const expectedOutputs = [
			[2, 4, 8, 16],
			[20, 40, 80, 160],
			[2, 6, 18, 54],
			[20, 60, 180, 540]
		]

		worker.terminate()

		expect(evaluations).toEqual(expectedOutputs)
	})

	test('valor de retorno para callbacks nativos', async () => {
		expect.assertions(1)

		const worker = new NodeWorker(parseInt)
		const parameters = ['1.5', '2.5', '4.5', '8.5']
		const evaluations = await Promise.all(parameters.map(parameter => worker.run(parameter)))
		const expectedOutputs = [1, 2, 4, 8]

		worker.terminate()

		expect(evaluations).toEqual(expectedOutputs)
	})

	test('valor de retorno para callbacks que retornam `Promise`', async () => {
		expect.assertions(1)

		const worker = new NodeWorker((...args: number[]) => {
			return new Promise(resolve => resolve(args.map(arg => arg * 2)))
		})

		const parameters = [
			[1, 2, 4, 8],
			[10, 20, 40, 80],
			[1, 3, 9, 27],
			[10, 30, 90, 270]
		]

		const evaluations = await Promise.all(parameters.map(parameter => worker.run(...parameter)))

		const expectedOutputs = [
			[2, 4, 8, 16],
			[20, 40, 80, 160],
			[2, 6, 18, 54],
			[20, 60, 180, 540]
		]

		worker.terminate()

		expect(evaluations).toEqual(expectedOutputs)
	})

	test('callback sem argumentos e sem valor de retorno', async () => {
		expect.assertions(1)

		const worker = new NodeWorker(() => { })
		const evaluation =  await worker.run()

		worker.terminate()

		expect(evaluation).toBe(undefined)
	})

	test('erro quando fornecido escopo + arrow function', () => {
		function evaluateToSuccess() {
			try {
				new NodeWorker(() => { }).terminate()
				new NodeWorker(function () { }).terminate()
				new NodeWorker({ a: 1 }, function () { return this.a }).terminate()
				new NodeWorker({ a: 1 }, async function () { return this.a }).terminate()

				return true
			}
			catch (error) {
				return false
			}
		}

		function evaluateToError() {
			try {
				new NodeWorker({ a: 1 }, () => { }).terminate()

				return false
			}
			catch (error) {
				return true
			}
		}

		const evalutionToSuccess = evaluateToSuccess()
		const evaluationToError = evaluateToError()

		expect(evalutionToSuccess).toBeTruthy()
		expect(evaluationToError).toBeTruthy()
	})

	test('variáveis de escopo', async () => {
		const worker = new NodeWorker({
			a: 2,
			b: 4,
			c: {
				ca: 8
			}
		}, function () {
			return this.a + this.b + this.c.ca
		})

		const returnValue = await worker.run()

		worker.terminate()

		expect(returnValue).toBe(2 + 4 + 8)
	})
})