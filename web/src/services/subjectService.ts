import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

export interface Subject { id: string; name: string }
export interface SubjectRequest { id: string; name: string; status: 'pending' | 'approved' | 'rejected'; requestedBy: string }
export interface SubjectSetup { subjects: Subject[]; requests: SubjectRequest[]; preferredSubjectIds: string[]; subjectColors: Record<string, string>; isAdmin: boolean }
export interface SubjectSession { id: string; studyDate: string; totalSeconds: number; subjectId: string | null; didQuestions: boolean | null; questionCount: number | null; correctCount: number | null; detailsRecorded: boolean }
export interface SessionDetails { sessionId: string; subjectId: string | null; didQuestions: boolean; questionCount: number; correctCount: number }
export interface SubjectChartData {
  today: string;
  subjects: { id: string; name: string; color: string | null }[];
  days: { date: string; subjectId: string | null; seconds: number; questions: number; correct: number }[];
}

async function call<I, O>(name: string, input: I): Promise<O> {
  const result = await httpsCallable<I, O>(functions, name)(input);
  return result.data;
}

export const getSubjectSetup = () => call<object, SubjectSetup>('get_subject_setup', {});
export const createSubject = (name: string) => call('create_subject', { name });
export const requestSubject = (name: string) => call('request_subject', { name });
export const reviewSubject = (requestId: string, decision: 'approve' | 'reject', name?: string) => call('review_subject', { requestId, decision, name });
export const setPreferredSubjects = (subjectIds: string[]) => call<{ subjectIds: string[] }, { preferredSubjectIds: string[] }>('set_preferred_subjects', { subjectIds });
export const setSubjectColor = (subjectId: string, color: string) => call<{ subjectId: string; color: string }, { subjectId: string; color: string }>('set_subject_color', { subjectId, color });
export const saveSubjectSetup = (subjectIds: string[], subjectColors: Record<string, string>) => call<{ subjectIds: string[]; subjectColors: Record<string, string> }, { preferredSubjectIds: string[]; subjectColors: Record<string, string> }>('save_subject_setup', { subjectIds, subjectColors });
export const saveSessionDetails = (details: SessionDetails) => call<SessionDetails, { success: boolean }>('save_session_details', details);
export const getSubjectSessions = () => call<object, SubjectSession[]>('get_subject_sessions', {});
export const getSubjectChartData = (uid?: string) => call<{ uid?: string }, SubjectChartData>('get_subject_chart_data', uid ? { uid } : {});
