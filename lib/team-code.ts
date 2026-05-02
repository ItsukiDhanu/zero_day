import { randomBytes } from "crypto";

const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TEAM_LINK_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomToken(length: number, alphabet: string) {
  const bytes = randomBytes(length);
  let token = "";

  for (let index = 0; index < length; index += 1) {
    token += alphabet[bytes[index] % alphabet.length];
  }

  return token;
}

export function generateTeamJoinCode() {
  return randomToken(6, TEAM_CODE_ALPHABET);
}

export function generateTeamJoinLink() {
  // Generate a 24-character URL-safe token
  return randomToken(24, TEAM_LINK_ALPHABET);
}
