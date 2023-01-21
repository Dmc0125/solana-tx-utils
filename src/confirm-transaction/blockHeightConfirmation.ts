import { Connection } from '@solana/web3.js'
import { wait } from '../utils/wait.js'

import { TxUnconfirmedResponse } from './types.js'

export const watchBlockHeight = async (
	startTime: number,
	lastValidBlockHeight: number,
	abortSignal: AbortSignal,
	connection: Connection,
	maxConfirmationTime: number,
): Promise<TxUnconfirmedResponse> => {
	while (new Date().getTime() - startTime < maxConfirmationTime && !abortSignal.aborted) {
		let blockHeight = -1
		try {
			blockHeight = await connection.getBlockHeight(connection.commitment)
		} catch (err) {}

		if (blockHeight > lastValidBlockHeight) {
			return {
				status: 'BLOCK_HEIGHT_EXCEEDED',
				error: null,
				data: null,
			}
		}

		await wait(2000)
	}

	return {
		status: 'TIMEOUT',
		data: null,
		error: null,
	}
}
