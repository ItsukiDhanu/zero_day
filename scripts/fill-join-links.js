const { PrismaClient } = require('@prisma/client');

const TEAM_LINK_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generateToken() {
  let token = '';
  for (let i = 0; i < 24; i++) token += TEAM_LINK_ALPHABET[Math.floor(Math.random() * TEAM_LINK_ALPHABET.length)];
  return token;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const teams = await prisma.team.findMany({ where: { joinLink: null }, select: { id: true, name: true, joinLink: true } });
    console.log(`Found ${teams.length} teams without joinLink`);

    for (const t of teams) {
      let tries = 0;
      while (tries < 10) {
        const token = generateToken();
        const exists = await prisma.team.findUnique({ where: { joinLink: token }, select: { id: true } });
        if (!exists) {
          await prisma.team.update({ where: { id: t.id }, data: { joinLink: token } });
          console.log(`Updated team ${t.id} (${t.name}) with joinLink=${token}`);
          break;
        }
        tries += 1;
      }
      if (tries >= 10) {
        console.warn(`Could not find unique token for team ${t.id}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });
