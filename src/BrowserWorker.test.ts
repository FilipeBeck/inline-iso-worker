import os from 'os'
import path from 'path'
import fs from 'fs'
import { getTsconfig } from 'get-tsconfig'
import webpack from 'webpack'
import BrowserWorker from './BrowserWorker'
import mockConsole from 'jest-mock-console'

declare global {
	const InlineWorker: new <TCallback extends (...args: any[]) => any>(callback: TCallback) => BrowserWorker<TCallback>
}

const indexTSScript = `
	import BrowserWorker from '${require.resolve('./BrowserWorker')}'
	;(window as any).InlineWorker = BrowserWorker
`

const tsConfigPath = getTsconfig().fileName

const tempDir = path.join(os.tmpdir(), Math.random().toString())
const inputFileName = path.join(tempDir, 'index.ts')
const outputFileName = path.join(tempDir, 'index.js')

const tsConfig = fs.readFileSync(tsConfigPath, 'utf8')

fs.mkdirSync(tempDir)
fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), tsConfig)
fs.writeFileSync(inputFileName, indexTSScript)

const compiler = webpack({
	entry: inputFileName,
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: require.resolve('ts-loader')
			}
		]
	},
	resolve: {
		extensions: ['.js', '.ts'],
		alias: {
			'tslib': require.resolve('tslib')
		}
	},
	output: { path: tempDir, filename: 'index.js' }
})

const indexEvaluation = new Promise<void>((resolve, reject) => {
	compiler.run(async (error, stats) => {
		try {
			if (error || stats.hasErrors()) {
				reject(error || stats.compilation.errors.map(error => ({ ...error, module: undefined })))
			}
			else {
				const indexJSScript = fs.readFileSync(outputFileName, 'utf8')
				await page.evaluate(indexJSScript)
				resolve()
			}
		}
		catch (error) {
			reject(error)
		}
	})
})

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

	test('valor de retorno para callbacks não-nativos"', async () => {
		expect.assertions(1)

		const evaluations = await page.evaluate(async () => {
			const worker = new InlineWorker((...args: number[]) => {
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

		const expectedOutputs = [
			[2, 4, 8, 16],
			[20, 40, 80, 160],
			[2, 6, 18, 54],
			[20, 60, 180, 540]
		]

		expect(evaluations).toEqual(expectedOutputs)
	})

	test('valor de retorno para callbacks nativos', async () => {
		expect.assertions(1)

		const evaluations = await page.evaluate(async () => {
			const worker = new InlineWorker(parseInt)

			const parameters = ['1.5', '2.5', '4.5', '8.5']

			return await Promise.all(parameters.map(parameter => worker.run(parameter)))
		})

		const expectedOutputs = [1, 2, 4, 8]

		expect(evaluations).toEqual(expectedOutputs)
	})
})