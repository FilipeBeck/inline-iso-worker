import path from 'path'
import pack from './packteer'
import { WorkerConstructor } from '../src/InlineWorker'
import mockConsole from 'jest-mock-console'

declare global {
	const BrowserWorker: WorkerConstructor
}

const indexEvaluation = pack(page, path.resolve(__dirname, '..', 'src', 'BrowserWorker.ts'))

page.on('console', msg => {
	console.log('--- PAGE LOG ---', msg.text())
})

page.on('error', error => {
	console.log('--- PAGE ERROR ---', error)
})

page.on('workercreated', worker => {
	console.log('--- PAGE WORKER CRIADO ---' + worker.url())
})

page.on('workerdestroyed', worker => {
	console.log('--- PAGE WORKER DESTRUIDO ---' + worker.url())
})

describe('Método run()', () => {
	beforeAll(async () => {
		await indexEvaluation
	})

	beforeEach(() => {
		mockConsole()
	})

	test('propagação de exceções dentro do callback', async () => {
		expect.assertions(1)

		const message = await page.evaluate(async () => {
			const worker = new BrowserWorker(() => {
				throw new Error('throwed')
			})

			try {
				await worker.run()
				return 'not-throwed'
			}
			catch (error) {
				return error.message
			}
		})

		expect(message).toBe('throwed')
	})

	test('valor de retorno para callbacks não-nativos', async () => {
		expect.assertions(2)

		const evaluations_1 = await page.evaluate(async () => {
			const worker = new BrowserWorker((...args: number[]) => {
				return args.map(arg => arg * 2)
			})

			const parameters = [
				[1, 2, 4, 8],
				[10, 20, 40, 80],
				[1, 3, 9, 27],
				[10, 30, 90, 270]
			]

			return await Promise.all(parameters.map(parameter => worker.run(...parameter)))
		})

		const expectedOutputs_1 = [
			[2, 4, 8, 16],
			[20, 40, 80, 160],
			[2, 6, 18, 54],
			[20, 60, 180, 540]
		]

		const evaluations_2 = await page.evaluate(async () => {
			const worker = new BrowserWorker((...args: number[]) => {
				return args.map(arg => arg.toString())
			})

			const parameters = [1, 2, 4, 8]

			return worker.run(...parameters)
		})

		const expectedOutputs_2 = ['1', '2', '4', '8']

		expect(evaluations_1).toEqual(expectedOutputs_1)
		expect(evaluations_2).toEqual(expectedOutputs_2)
	})

	test('valor de retorno para callbacks nativos', async () => {
		expect.assertions(1)

		const evaluations = await page.evaluate(async () => {
			const worker = new BrowserWorker(parseInt)
			const parameters = ['1.5', '2.5', '4.5', '8.5']

			return await Promise.all(parameters.map(parameter => worker.run(parameter)))
		})

		const expectedOutputs = [1, 2, 4, 8]

		expect(evaluations).toEqual(expectedOutputs)
	})

	test('callback sem argumentos e sem valor de retorno', async () => {
		expect.assertions(1)

		const evaluation = await page.evaluate(async () => {
			const worker = new BrowserWorker(() => {})

			return await worker.run()
		})

		expect(evaluation).toBe(undefined)
	})

	test('erro quando fornecido escopo + arrow function', async () => {
		async function evaluateToSuccess() {
			return await page.evaluate(() => {
				try {
					new BrowserWorker(() => { })
					new BrowserWorker(function () { })
					new BrowserWorker({ a: 1 }, function () { return this.a })

					return true
				}
				catch (error) {
					return false
				}
			})
		}

		async function evaluateToError() {
			return await page.evaluate(() => {
				try {
					new BrowserWorker({ a: 1 }, () => { })

					return false
				}
				catch (error) {
					return true
				}
			})
		}

		const evalutionToSuccess = await evaluateToSuccess()
		const evaluationToError = await evaluateToError()

		expect(evalutionToSuccess).toBeTruthy()
		expect(evaluationToError).toBeTruthy()
	})

	test('variáveis de escopo', async () => {
		const returnValue = await page.evaluate(async () => {
			const worker = new BrowserWorker({
				a: 2,
				b: 4,
				c: {
					ca: 8
				}
			}, function () {
				return this.a + this.b + this.c.ca
			})

			return await worker.run()
		})

		expect(returnValue).toBe(2 + 4 + 8)
	})
})