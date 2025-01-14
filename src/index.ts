// Express Server Typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import UserRouter from "./routes/user-routes";
import CompanyRouter from "./routes/comapny-routes";
import JobRouter from "./routes/job-routes";
import InviteRouter from "./routes/invite-routes";
import MatchReportRouter from "./routes/match-report-routes";
import MatchRouter from "./routes/match-routes";
import UserProfileRouter from "./routes/user-profile-routes";
import ApplicationRouter from "./routes/application-routes";
import { RouteNotFound } from "./middlewares/error-handling/route-not-found";
import { ErrorHandler } from "./middlewares/error-handling/general-error-handler";
import InterviewRouter from "./routes/interview-routes";

dotenv.config({ path: "./../.env" });

const app: express.Application = express();

app.use(
	cors({
		origin: process.env.ALLOWED_ORIGINS,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"Accept",
			"Origin",
			"X-Requested-With",
			"X-CSRF-Token",
		],
	})
);

app.use(express.json());

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/companies", CompanyRouter);
app.use("/api/v1/jobs", JobRouter);
app.use("/api/v1/invites", InviteRouter);
app.use("/api/v1/match-reports", MatchReportRouter);
app.use("/api/v1/matches", MatchRouter);
app.use("/api/v1/user-profile", UserProfileRouter);
app.use("/api/v1/applications", ApplicationRouter);
app.use("/api/v1/interviews", InterviewRouter);

// Error handling middleware
app.use(RouteNotFound);
app.use(ErrorHandler);

app.listen(process.env.PORT, () => {
	console.log("Server is running on port " + process.env.PORT);
});
