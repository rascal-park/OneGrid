// src/components/OneGrid/formatters.ts
import type { OneGridFormatterConfig } from '../../types/types';

/**
 * 숫자 포매터 옵션
 *  - decimalPlaces : 소수점 자리수 (undefined 면 원래 값 유지)
 *  - useGrouping   : 천단위 콤마
 *  - unit          : '원', '개' 같은 단위 문자열
 */
export type NumberFormatterOptions = {
	decimalPlaces?: number;
	useGrouping?: boolean;
	unit?: string;
};

/**
 * 숫자 포매터 생성
 *  ex) formatter: createNumberFormatter({ decimalPlaces: 2 })
 *      formatter: createNumberFormatter({ useGrouping: true, unit: '원' })
 */
export function createNumberFormatter(options: NumberFormatterOptions = {}): OneGridFormatterConfig {
	const { decimalPlaces, useGrouping = true, unit } = options;

	return {
		format: (value: any) => {
			if (value == null || value === '') return '';

			const num = typeof value === 'number' ? value : Number(value);
			if (Number.isNaN(num)) return value; // 숫자 변환 실패 시 원래 값 반환

			const formatter = new Intl.NumberFormat('ko-KR', {
				useGrouping,
				// decimalPlaces 가 지정되면 고정 소수점, 아니면 원래 소수 유지
				minimumFractionDigits: typeof decimalPlaces === 'number' ? decimalPlaces : undefined,
				maximumFractionDigits: typeof decimalPlaces === 'number' ? decimalPlaces : undefined,
			});

			const formatted = formatter.format(num);
			return unit ? `${formatted}${unit}` : formatted;
		},
	};
}

/**
 * 날짜 포매터 옵션
 *  - format : 'yyyy-MM-dd' | 'yyyy.MM.dd' | 'yyyy/MM/dd' | 'locale'
 *  - locale : locale 모드일 때 사용할 로케일 (기본: 'ko-KR')
 */
export type DateFormatterOptions = {
	format?: 'yyyy-MM-dd' | 'yyyy.MM.dd' | 'yyyy/MM/dd' | 'locale';
	locale?: string;
};

export function createDateFormatter(options: DateFormatterOptions = {}): OneGridFormatterConfig {
	const { format = 'yyyy-MM-dd', locale = 'ko-KR' } = options;

	return {
		format: (value: any) => {
			if (!value) return '';

			let d: Date | null = null;

			if (value instanceof Date) {
				d = value;
			} else if (typeof value === 'string' || typeof value === 'number') {
				const parsed = new Date(value);
				if (!Number.isNaN(parsed.getTime())) {
					d = parsed;
				}
			}

			if (!d) return value; // 파싱 실패 시 원래 값 반환

			if (format === 'locale') {
				return d.toLocaleDateString(locale);
			}

			const y = d.getFullYear();
			const m = `${d.getMonth() + 1}`.padStart(2, '0');
			const day = `${d.getDate()}`.padStart(2, '0');

			switch (format) {
				case 'yyyy-MM-dd':
					return `${y}-${m}-${day}`;
				case 'yyyy.MM.dd':
					return `${y}.${m}.${day}`;
				case 'yyyy/MM/dd':
					return `${y}/${m}/${day}`;
				default:
					return `${y}-${m}-${day}`;
			}
		},
	};
}
