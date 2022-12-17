export const wait = (timeoutMs: number): Promise<null> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(null)
		}, timeoutMs)
	})
}
