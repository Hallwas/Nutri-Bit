import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'usuario@upf.br' },
  });
  if (!user) {
    throw new Error(
      'Usuário usuario@upf.br não encontrado. Cadastre primeiro pelo /api/auth/register.',
    );
  }

  let profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        fullName: user.name,
      },
    });
  }

  const arrozIntegral = await prisma.food.upsert({
    where: { tbcaCode: '646A' },
    update: {},
    create: {
      tbcaCode: '646A',
      name: 'Arroz, integral, cozido',
      umidade: 65.75,
      glicose: 0.01,
      frutose: 0.0,
      sacarose: 0.01,
      acucaresTotaisDisponiveis: 0.02,
      amidoTotal: 29.92,
      amidoDisponivel: 29.09,
      carboidratosDisponiveis: 29.11,
    },
  });

  const arrozPolido = await prisma.food.upsert({
    where: { tbcaCode: '645A' },
    update: {},
    create: {
      tbcaCode: '645A',
      name: 'Arroz, polido, cozido',
      umidade: 75.47,
      glicose: 0.04,
      frutose: 0.01,
      sacarose: 0.05,
      acucaresTotaisDisponiveis: 0.1,
      amidoTotal: 20.41,
      amidoDisponivel: 19.76,
      carboidratosDisponiveis: 19.86,
    },
  });

  const macarrao = await prisma.food.upsert({
    where: { tbcaCode: '728A' },
    update: {},
    create: {
      tbcaCode: '728A',
      name: 'Macarrão, espaguete, cozido',
      umidade: 70.35,
      glicose: 0.02,
      frutose: 0.02,
      sacarose: 0.04,
      acucaresTotaisDisponiveis: 0.07,
      amidoTotal: 25.53,
      amidoDisponivel: 24.86,
      carboidratosDisponiveis: 24.83,
    },
  });

  const aveia = await prisma.food.upsert({
    where: { tbcaCode: '732A' },
    update: {},
    create: {
      tbcaCode: '732A',
      name: 'Aveia, flocos',
      umidade: 9.86,
      glicose: 0.01,
      frutose: 0.0,
      sacarose: 0.56,
      acucaresTotaisDisponiveis: 0.57,
      amidoTotal: 51.23,
      amidoDisponivel: 48.81,
    },
  });

  const biscoito = await prisma.food.upsert({
    where: { tbcaCode: '642A' },
    update: {},
    create: {
      tbcaCode: '642A',
      name: 'Biscoito, doce, maisena',
      umidade: 2.88,
      glicose: 0.92,
      frutose: 0.71,
      sacarose: 14.48,
      acucaresTotaisDisponiveis: 16.11,
      amidoTotal: 46.57,
      amidoDisponivel: 44.17,
      carboidratosDisponiveis: 60.27,
    },
  });

  const plan = await prisma.mealPlan.create({
    data: {
      name: 'Cutting',
      goal: 'CUTTING',
      description: 'Plano de exemplo para perda de gordura',
      active: true,
      profileId: profile.id,
      weeks: {
        create: [
          {
            number: 1,
            label: 'Semana 1',
            days: {
              create: [
                {
                  weekday: 'SEGUNDA',
                  order: 1,
                  meals: {
                    create: [
                      { name: 'Café da manhã', type: 'CAFE_DA_MANHA', time: '08:00' },
                      { name: 'Almoço', type: 'ALMOCO', time: '12:00' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { weeks: { include: { days: { include: { meals: true } } } } },
  });

  const meals = plan.weeks[0].days[0].meals;
  const cafe = meals.find((m) => m.type === 'CAFE_DA_MANHA')!;
  const almoco = meals.find((m) => m.type === 'ALMOCO')!;

  await prisma.ingredient.createMany({
    data: [
      { quantity: 60, unit: 'g', mealId: cafe.id, foodId: aveia.id },
      { quantity: 30, unit: 'g', mealId: cafe.id, foodId: biscoito.id },
      { quantity: 150, unit: 'g', mealId: almoco.id, foodId: arrozIntegral.id },
      { quantity: 100, unit: 'g', mealId: almoco.id, foodId: macarrao.id },
      { quantity: 120, unit: 'g', mealId: almoco.id, foodId: arrozPolido.id },
    ],
  });

  console.log('Seed concluído:');
  console.log('- 1 plano:', plan.name);
  console.log('- 1 semana / 1 dia / 2 refeições');
  console.log('- 5 alimentos e 5 ingredientes');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });