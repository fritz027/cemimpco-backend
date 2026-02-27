export interface Survey {
  survey_id: string;
  survey_name: string;
  survey_from: string; // TIMESTAMP string
  survey_to: string;   // TIMESTAMP string
};

export interface SurveyQuestion {
  survey_id: string;
  survey_qid: number;
  survey_seq: number;
  survey_question: string;
  survey_context: string;
};


export interface SubmitSurveyAnswer {
  survey_qid: number;
  answer: string; // 'Y'/'N' or whatever you support
};
