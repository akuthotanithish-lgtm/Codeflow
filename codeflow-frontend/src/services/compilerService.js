import api from './api';

/**
 * Handles the "Run" button.
 */
export const runAgainstSamples = async (questionId, code, language, testCase) => {
    const body = { questionId, code, language, input: testCase };
    const res = await api.post('/submissions/run', body);
    // --- FIX: Return the entire response object, not just the data. ---
    // The calling component ([id].jsx) expects to access `response.data`.
    return res;
};

/**
 * Handles the "Submit" button.
 */
export const submitSolution = async (questionId, code, language) => {
    const body = { code, language };
    const res = await api.post(`/submissions/${questionId}`, body);
    // --- FIX: Return the entire response object. ---
    return res;
};

/**
 * Polls for the result of a single submission.
 */
export const getSubmissionResult = async (submissionId) => {
    const res = await api.get(`/submissions/${submissionId}`);
    // --- FIX: Return the entire response object. ---
    return res;
};

/**
 * Gets all previous submissions for a question by the current user.
 */
export const getAllUserSubmissions = async (questionId) => {
    const res = await api.get(`/submissions/user/question/${questionId}`);
    // --- FIX: Return the entire response object. ---
    return res;
};

// --- Other functions remain for context ---

export const runInPlayground = async (code, language, input) => {
    const response = await api.post('/playground/run', { code, language, input });
    // Assuming this might be called differently, but for consistency:
    return response;
};


export const analyzeSolution = async (code, language) => {
    const response = await api.post('/submissions/analyze', { code, language });
    // Assuming this might be called differently, but for consistency:
    return response;
};