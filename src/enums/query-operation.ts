enum QueryOperation {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    GREATER_THAN_EQUALS = 'GREATER_THAN_EQUALS',
    LESS_THAN_EQUALS = 'LESS_THAN_EQUALS',
    LIKE = 'LIKE',
    ILIKE = 'ILIKE',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
    IS_NULL = 'IS_NULL',
    IS_NOT_NULL = 'IS_NOT_NULL',
    BETWEEN = 'BETWEEN'
}

export default QueryOperation;