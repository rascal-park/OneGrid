// 트리 구조(children)를 OneGrid 에서 쓰기 좋은 플랫 배열로 변환하는 유틸

export interface TreeConfig {
	idField?: string; // 기본 'id'
	childrenField?: string; // 기본 'children'
}

/**
 * 계층형 데이터 → 플랫 배열 + 트리 메타필드(_tree*) 로 변환
 *
 * - _treeId: 노드 고유 id
 * - _treeParentId: 부모 id (루트는 null)
 * - _treeLevel: 0부터 시작하는 레벨 (루트=0)
 * - _treeHasChildren: 자식 존재 여부
 * - _treeExpanded: true/undefined = 펼침, false = 접힘
 */
export function flattenTree<T extends Record<string, any>>(
	nodes: T[],
	config: TreeConfig = {},
	level = 0,
	parentId: string | number | null = null,
): T[] {
	const idField = config.idField ?? 'id';
	const childrenField = config.childrenField ?? 'children';

	const result: T[] = [];

	nodes.forEach(node => {
		const id = (node as any)[idField];
		const children = (node as any)[childrenField] as T[] | undefined;

		const cloned: any = { ...node };

		// 원본 children 필드는 제거 (필요하면 유지해도 상관 없음)
		delete cloned[childrenField];

		cloned._treeId = id;
		cloned._treeParentId = parentId;
		cloned._treeLevel = level;
		cloned._treeHasChildren = !!(children && children.length > 0);
		if (cloned._treeExpanded === undefined) {
			cloned._treeExpanded = true;
		}

		result.push(cloned);

		if (children && children.length > 0) {
			result.push(...flattenTree(children, config, level + 1, id));
		}
	});

	return result;
}
