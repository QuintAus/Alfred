import type { ApplicantProfile, MatchResult } from "../../lib/types";

export interface StepProps {
  profile: ApplicantProfile;
  set: (fn: (p: ApplicantProfile) => ApplicantProfile) => void;
  match: MatchResult;
}
