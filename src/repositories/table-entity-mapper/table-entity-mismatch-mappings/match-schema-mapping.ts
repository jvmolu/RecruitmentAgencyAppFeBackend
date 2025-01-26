// src/repositories/table-entity-mapper/table-entity-mismatch-mappings/match-schema-mapping.ts
export default {
    mappings: [
      { entityField: 'matchReportId', dbField: 'match_report_id' },
      { entityField: 'jobId', dbField: 'job_id' },
      { entityField: 'candidateId', dbField: 'candidate_id' },
      { entityField: 'similarityScore', dbField: 'similarity_score' },
      { entityField: 'createdAt', dbField: 'created_at' },
      { entityField: 'updatedAt', dbField: 'updated_at' },
    ],
  };