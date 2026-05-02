export const MIN_TEAM_MEMBERS = 2;
export const BASE_TEAM_MEMBER_LIMIT = 4;
export const EXTRA_SLOT_TEAM_MEMBER_LIMIT = 5;

export function getTeamMemberLimit(extraSlotUnlocked: boolean) {
  return extraSlotUnlocked ? EXTRA_SLOT_TEAM_MEMBER_LIMIT : BASE_TEAM_MEMBER_LIMIT;
}

export function isConfirmedTeamSize(memberCount: number, extraSlotUnlocked: boolean) {
  const memberLimit = getTeamMemberLimit(extraSlotUnlocked);
  return memberCount >= MIN_TEAM_MEMBERS && memberCount <= memberLimit;
}
