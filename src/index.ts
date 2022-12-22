import fetch from 'node-fetch'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = fetch

export {
	sendTransaction,
	TxSuccessResponse,
	TxErrorResponse,
	TxUnconfirmedResponse,
	SendTransactionParams,
} from './sendTransaction.js'
export {
	buildAndSignTxFromInstructions,
	buildAndSignTxFromMessageV0,
	BuiltTransactionData,
	BuildAndSignTxFromInstructionsParams,
	BuildAndSignTxFromMessageV0Params,
} from './buildTransaction.js'
export { ParsedTransactionError } from './utils/parseTransaction.js'
