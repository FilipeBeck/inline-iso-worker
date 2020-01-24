import path from 'path'
import SupposedNodeWorker from '../src/index'
import pack from './packteer'
import { WorkerConstructor } from '../src/InlineWorker'

declare global {
	const SupposedBrowserWorker: WorkerConstructor
	const SupposedFallbackWorker: WorkerConstructor
}

const browserWorkerAssertion = pack(page, path.resolve(__dirname, '..', 'src', 'index.ts'), 'SupposedBrowserWorker')

describe('Exportação de acordo com o ambiente', () => {
	beforeAll(async () => {
		await browserWorkerAssertion
	})

	test('exporta `NodeWorker` quando em Node', () => {
		const constructorName = SupposedNodeWorker.name

		expect(constructorName).toBe('NodeWorker')
	})

	test('exporta `BrowserWorker` quando em Browser', async () => {
		const constructorName = await page.evaluate(() => {
			return SupposedBrowserWorker.name
		})

		expect(constructorName).toBe('BrowserWorker')
	})

	test('exporta `FallbackWorker` em ambiente sem `Worker`', async () => {
		await page.reload()
		await page.evaluate(() => (window as any).Worker = undefined )
		await pack(page, path.resolve(__dirname, '..', 'src', 'index.ts'), 'SupposedFallbackWorker')

		const constructorName = await page.evaluate(() => {
			return SupposedFallbackWorker.name
		})

		expect(constructorName).toBe('FallbackWorker')
	})
})