// Middleware to Lock a Route
// This middleware is used to lock a route for a specific time period. This is useful when you want to prevent multiple requests to a route that can cause

import { NextFunction, Request, Response } from "express";
import RedisService from "../services/redis-service";
import { isGeneralAppFailureResponse } from "../types/response/general-app-response";

const LockRouteFor60Seconds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        
        // get user id
        const userId = req.body.user.id;

        // get route
        const route = req.originalUrl;

        // create key
        const key = route + '--' + userId;

        // block this url for user for 60 seconds
        const result = await RedisService.lock_resource(key, { expiresInMillis: 60000 });        
        if(isGeneralAppFailureResponse(result)) {
            res.status(result.statusCode).json({
                success: false,
                message: result.businessMessage,
                error: result.error
            });
        }

        next();

        // unlock the route
        await RedisService.unlock_resource(key);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export default LockRouteFor60Seconds;