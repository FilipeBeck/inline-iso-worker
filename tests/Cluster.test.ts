import Cluster from '../src/Cluster'

describe('Método run()', () => {
	const scopes = [
		{ x: 1 },
		{ x: 2 },
		{ x: 3 },
		{ x: 4 }
	]

	test('valor de retorno', async () => {
		expect.assertions(1)

		const cluster = new Cluster(scopes, function (sum: number) {
			return this.x + sum
		})

		const parameters = [1, 2, 3, 4]
		const expectedOutputs = [
			[2, 3, 4, 5],
			[3, 4, 5, 6],
			[4, 5, 6, 7],
			[5, 6, 7, 8]
		]

		const outputs = await Promise.all(parameters.map(parameter => cluster.run(parameter)))
		cluster.terminate()

		expect(outputs).toEqual(expectedOutputs)
	})

	test('variáveis de escopo', async () => {
		expect.assertions(1)

		const cluster = new Cluster(scopes, function(coeficient: number) {
			return this.x * coeficient
		})

		const returnValues = await cluster.run(2)
		cluster.terminate()

		expect(returnValues).toEqual([2, 4, 6, 8])
	})

	test('exceção quando `scopes == []`', async () => {
		function assert() {
			return new Cluster([], () => { return })
		}

		expect(assert).toThrow()
	})
})