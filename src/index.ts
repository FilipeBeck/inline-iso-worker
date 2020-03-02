import { WorkerConstructor } from './InlineWorker'
import isNode from 'detect-node'

let $Worker: WorkerConstructor

if (isNode) {
	$Worker = require('./NodeWorker').default
}
else if (typeof Worker !== 'undefined') {
	$Worker = require('./BrowserWorker').default
}
else {
	$Worker = require('./FallbackWorker').default
}

export default $Worker