export type RedisError =  Error & {
    errorType: "RedisError";
};