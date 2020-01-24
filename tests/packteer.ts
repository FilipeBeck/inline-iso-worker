import os from 'os'
import path from 'path'
import webpack from 'webpack'
import { promises as fs } from 'fs'
import { Page } from 'puppeteer'

export default async function pack(page: Page, entry: string, library?: string): Promise<void> {
	const inputFileName = entry.split('/').pop()!
	const outputDirName = path.join(os.tmpdir(), Math.random().toString())
	const outputFileName = 'test.out.js'
	const outputPathName = path.join(outputDirName, outputFileName)

	const compiler = webpack({
		entry,
		mode: 'development',
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
		output: {
			library: library || inputFileName.replace(/\.ts$/, ''),
			libraryExport: 'default',
			libraryTarget: 'umd',
			path: outputDirName,
			filename: outputFileName
		}
	})

	await new Promise<void>((resolve, reject) => {
		compiler.run(async (error, stats) => {
			try {
				if (error || stats.hasErrors()) {
					reject(error || stats.compilation.errors.map(error => ({ ...error, module: undefined })))
				}
				else {
					const indexJSScript = await fs.readFile(outputPathName, 'utf8')
					await page.evaluate(indexJSScript)
					resolve()
				}
			}
			catch (error) {
				reject(error)
			}
		})
	})
}