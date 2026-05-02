const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TEAM_LINK_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateTeamJoinCode() {
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += TEAM_CODE_ALPHABET[Math.floor(Math.random() * TEAM_CODE_ALPHABET.length)];
  }

  return code;
}

export function generateTeamJoinLink() {
  let link = "";

  // Generate a 24-character URL-safe token
  for (let index = 0; index < 24; index += 1) {
    link += TEAM_LINK_ALPHABET[Math.floor(Math.random() * TEAM_LINK_ALPHABET.length)];
  }

  return link;
}
