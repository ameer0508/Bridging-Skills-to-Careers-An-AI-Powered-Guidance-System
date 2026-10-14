import type { UnifiedCareerSnapshot } from './types';

export interface BestAction {
  title: string;
  why: string;
  route: string;
  label: string;
}

/**
 * The single most useful thing to do now, from the snapshot's own rule (resume → skills → goal →
 * gap → practice → jobs). The wording is the dashboard's; the decision is the server's.
 */
export const bestActionFor = (snapshot: UnifiedCareerSnapshot): BestAction => {
  const action = snapshot.nextBestAction?.action;
  const gap = snapshot.criticalGaps[0];
  switch (action ?? (snapshot.resumeInfo?.hasResume ? 'explore_opportunities' : 'upload_resume')) {
    case 'upload_resume':
      return { title: 'Upload your resume', why: 'Your skills are read from it, and every score on this page starts there.', route: '/resume', label: 'Upload a resume' };
    case 'verify_skills':
      return { title: 'Check the skills found in your resume', why: 'Matches and readiness use only the skills you keep.', route: '/skills', label: 'Review skills' };
    case 'set_target_career':
      return { title: 'Choose the role you are working towards', why: 'Gaps, readiness and next steps are measured against it.', route: '/profile', label: 'Set your goal' };
    case 'close_skill_gap':
      return {
        title: gap ? `Start on ${gap}` : 'Work on your largest skill gap',
        why: `${gap ?? 'This skill'} is required for ${snapshot.targetCareer} and is not yet in your evidence.`,
        route: '/roadmap',
        label: 'Open the roadmap',
      };
    case 'prepare_interview':
      return { title: 'Practise an interview', why: `You have ${snapshot.opportunities.saved} saved job${snapshot.opportunities.saved === 1 ? '' : 's'} and no practice session yet.`, route: '/interview-agent', label: 'Start practice' };
    default:
      return { title: `Look at openings for ${snapshot.targetRole || snapshot.targetCareer}`, why: 'Your profile has the basics in place; compare it with real postings.', route: '/job-agent', label: 'Search jobs' };
  }
};
