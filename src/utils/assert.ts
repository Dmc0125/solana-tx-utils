export const assert = (cond: boolean, err?: Error) => {
	if (!cond) {
		throw err
	}
}
