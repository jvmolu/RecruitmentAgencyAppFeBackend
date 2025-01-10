// import { AIServiceResponse } from "../types/response/ai-service-response";

// class AiService {
    
//     private static AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

//     async generateInterviewQuestions() {
//             const aiResponse = await axios.post<AIServiceResponse>(
//                 `${AiService.AI_SERVICE_URL}/generate-questions`,
//                 {
//                     cv_data: cvData,
//                     job_description: jobDescription,
//                     count: 3,
//                 }
//             );

//             if (
//                 !aiResponse.data?.questions ||
//                 !Array.isArray(aiResponse.data.questions)
//             ) {
//                 throw new Error("Invalid response from AI service");
//             }

//             const interviewQuestions = aiResponse.data.questions.map(
//                 (q, index) => ({
//                     interviewId: interview.data.id,
//                     questionText: q.question,
//                     sequenceNumber: index + 1,
//                     isAiGenerated: true,
//                     estimatedTimeMinutes: q.estimated_time_minutes,
//                 })
//             );
//     }

// }