export enum JoinType {
    INNER = 'INNER JOIN',
    LEFT = 'LEFT JOIN',
    RIGHT = 'RIGHT JOIN',
    FULL = 'FULL JOIN',
    CROSS = 'CROSS JOIN',
    SELF = 'SELF JOIN',
    NATURAL = 'NATURAL JOIN',
}

export interface JoinClause {
    joinType: JoinType;
    tableName: string;
    alias?: string;
    onCondition: string;
}

