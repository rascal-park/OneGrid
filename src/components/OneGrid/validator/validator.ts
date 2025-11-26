// src/components/OneGrid/validator/validators.ts
import type { ValidatorFn } from '../../../types/types';

// 여러 validator 를 순서대로 실행해서 첫 에러 메시지만 반환
export function runValidators(validators: ValidatorFn[] | undefined, value: any): string | null {
	if (!validators || validators.length === 0) return null;
	for (const v of validators) {
		const msg = v(value);
		if (msg) return msg;
	}
	return null;
}

export const validators = {
	required:
		(message = '필수 입력값입니다.'): ValidatorFn =>
		value => {
			if (value === null || value === undefined) return message;
			if (typeof value === 'string' && value.trim() === '') return message;
			if (Array.isArray(value) && value.length === 0) return message;
			return null;
		},

	number:
		(message = '숫자만 입력 가능합니다.'): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			return isNaN(Number(value)) ? message : null;
		},

	integer:
		(message = '정수만 입력 가능합니다.'): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			if (!/^-?\d+$/.test(String(value))) return message;
			return null;
		},

	min:
		(minVal: number, message?: string): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			const n = Number(value);
			if (isNaN(n)) return null;
			if (n < minVal) return message ?? `${minVal} 이상이어야 합니다.`;
			return null;
		},

	max:
		(maxVal: number, message?: string): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			const n = Number(value);
			if (isNaN(n)) return null;
			if (n > maxVal) return message ?? `${maxVal} 이하이어야 합니다.`;
			return null;
		},

	range:
		(minVal: number, maxVal: number, message?: string): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			const n = Number(value);
			if (isNaN(n)) return null;
			if (n < minVal || n > maxVal) return message ?? `${minVal} ~ ${maxVal} 사이여야 합니다.`;
			return null;
		},

	email:
		(message = '올바른 이메일 형식이 아닙니다.'): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			const str = String(value).trim();
			// 대충 RFC 수준까진 아니고 실무용
			const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return re.test(str) ? null : message;
		},

	korean:
		(message = '한글만 입력 가능합니다.'): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			return /^[가-힣\s]+$/.test(String(value)) ? null : message;
		},

	english:
		(message = '영문만 입력 가능합니다.'): ValidatorFn =>
		value => {
			if (value === null || value === undefined || value === '') return null;
			return /^[A-Za-z\s]+$/.test(String(value)) ? null : message;
		},

	custom:
		(fn: (value: any) => string | null): ValidatorFn =>
		value =>
			fn(value),
};
