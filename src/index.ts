import InlineWorker from './InlineWorker'

let $Worker: new <TCallback extends (...args: any[]) => any, TScope extends object>(callback: TCallback) => InlineWorker<TCallback, TScope>

if (typeof Worker == 'undefined') {
	$Worker = require('./FakeWorker').default
}
else if (typeof window == 'undefined' || typeof window.document == 'undefined') {
	$Worker = require('./NodeWorker').default
}
else {
	$Worker = require('./BrowserWorker').default
}

export default $Worker