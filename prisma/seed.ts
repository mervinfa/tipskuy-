import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const customerEmail = "customer@tipskuy.test";
  const driverEmail = "driver@tipskuy.test";
  const passwordHash = await hash("Tipskuy123", {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      name: "Budi Santoso",
      email: customerEmail,
      passwordHash,
      phone: "081234567890",
      role: "CUSTOMER",
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: driverEmail },
    update: {},
    create: {
      name: "Andi Wijaya",
      email: driverEmail,
      passwordHash,
      phone: "082198765432",
      role: "DRIVER",
    },
  });

  const driver = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      vehicleType: "Motor",
      vehiclePlate: "H 1234 AB",
      whatsappNumber: "6281234567890",
      verificationStatus: "VERIFIED",
    },
  });

  await prisma.wallet.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: { userId: driverUser.id, balance: 0 },
  });

  const trip = await prisma.tripListing.findFirst({
    where: { driverId: driver.id, originCityCode: "3374", destCityCode: "3273" },
  });

  if (!trip) {
    await prisma.tripListing.create({
      data: {
        driverId: driver.id,
        serviceType: "JASTIP",
        originProvince: "Jawa Tengah",
        originCityCode: "3374",
        originCity: "Kota Semarang",
        originLat: -6.9667,
        originLng: 110.4167,
        destProvince: "Jawa Barat",
        destCityCode: "3273",
        destCity: "Kota Bandung",
        destLat: -6.9175,
        destLng: 107.6191,
        baseFee: 25000,
        notes: "Bisa titip barang kecil sampai sedang",
      },
    });
  }

  console.info(
    `Seed selesai: customer ${customer.email}, driver ${driverUser.email}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    return prisma.$disconnect();
  });
