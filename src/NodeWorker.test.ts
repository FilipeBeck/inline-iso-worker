import NodeWorker from '../app/NodeWorker'

describe('Métdodo run()', () => {
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

	test('callback sem argumentos e sem valor de retorno', async () => {
		expect.assertions(1)

		const worker = new NodeWorker(() => { })
		const evaluation =  await worker.run()

		worker.terminate()

		expect(evaluation).toBe(undefined)
	})
})