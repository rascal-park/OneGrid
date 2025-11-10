/* eslint-disable @typescript-eslint/no-explicit-any */

export function cloneRows(rowsToClone: any[]): any[] {
	return rowsToClone.map(r => ({ ...r }));
}

export function rowsEqual(a: any[], b: any[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		const ra = a[i];
		const rb = b[i];
		const keysA = Object.keys(ra);
		const keysB = Object.keys(rb);
		if (keysA.length !== keysB.length) return false;
		for (const k of keysA) {
			if (ra[k] !== rb[k]) return false;
		}
	}
	return true;
}
