import { Router } from "express";
import { QuestionController } from "../controllers/question-controller";

const QuestionRouter = Router();

QuestionRouter.get("/", QuestionController.getQuestions);
QuestionRouter.get("/:questionNumber", QuestionController.getQuestionByNumber);

export default QuestionRouter;
