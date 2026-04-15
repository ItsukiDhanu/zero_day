const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTeamJoinCode() {
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += TEAM_CODE_ALPHABET[Math.floor(Math.random() * TEAM_CODE_ALPHABET.length)];
  }

  return code;
}
