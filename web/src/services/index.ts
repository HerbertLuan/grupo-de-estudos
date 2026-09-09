export * as authService from './authService';
export * as studyService from './studyService';
export * as rankingService from './rankingService';
export * as profileService from './profileService';
export * as statsService from './statsService';
export * as feedService from './feedService';
export * as groupService from './groupService';
export * as badgeService from './badgeService';
export * as dailyStudyService from './dailyStudyService';

// Direct function exports for convenience
export { registerUser, loginUser, logoutUser, onAuthChange, ensureUserProfile } from './authService';
export {
  startSession,
  pauseSession,
  resumeSession,
  finishSession,
  discardSession,
  getCurrentSession,
} from './studyService';
export { getLeaderboard } from './rankingService';
export {
  getUserProfile,
  subscribeToProfile,
  updateProfile,
  uploadAvatar,
} from './profileService';
export { getUserStats, getUserHistory } from './statsService';
export {
  getGroupFeed,
  toggleLike,
  addComment,
  deleteComment,
  getComments,
} from './feedService';
export { joinGroupWithCode, getGroupMembers, createGroup } from './groupService';
export { getCatalogBadges, getUserBadges } from './badgeService';
export { subscribeToDailyStudy, getDailyStudy } from './dailyStudyService';
