import fetch from 'node-fetch'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = fetch

export { DEFAULT_SEND_OPTIONS, SendTransactionParams, sendTransaction } from './sendTransaction.js'
export {
	sendAndConfirmTransaction,
	SendAndConfirmTransactionParams,
	SendAndConfirmTransactionConfig,
	SendAndConfirmTransactionResponse,
} from './sendAndConfirmTransaction.js'
export {
	DEFAULT_MAX_CONFIRMATION_TIME,
	confirmTransaction,
	ConfirmTransactionParams,
} from './confirmTransaction.js'
export {
	TxErrorResponse,
	TxSuccessResponse,
	TxUnconfirmedResponse,
} from './confirm-transaction/types.js'
export {
	buildTransaction,
	buildAndSignTxFromInstructions,
	buildAndSignTxFromMessageV0,
	BuiltTransactionData,
	BuildTransactionParams,
	BuildAndSignTxFromInstructionsParams,
	BuildAndSignTxFromMessageV0Params,
} from './buildTransaction.js'
export { ParsedTransactionError } from './utils/parseTransaction.js'
