import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const defaultHours = {
  monday: { open: "09:00", close: "18:00" },
  tuesday: { open: "09:00", close: "18:00" },
  wednesday: { open: "09:00", close: "18:00" },
  thursday: { open: "09:00", close: "18:00" },
  friday: { open: "09:00", close: "19:00" },
  saturday: { open: "10:00", close: "19:00" },
  sunday: { open: "10:00", close: "17:00" },
};

const branches = [
  {
    name: "Queen St BB — Brisbane CBD",
    address: "123 Queen Street, Brisbane City QLD 4000",
    phone: "+61 7 1234 5678",
    email: "cbd@queenstbb.com",
    openingHours: JSON.stringify(defaultHours),
    pickupSlotDuration: 30,
    maxBookingsPerSlot: 3,
    minPrepNoticeHours: 24,
    allowSameDayBooking: false,
    isActive: true,
  },
  {
    name: "Queen St BB — South Bank",
    address: "45 Grey Street, South Brisbane QLD 4101",
    phone: "+61 7 2345 6789",
    email: "southbank@queenstbb.com",
    openingHours: JSON.stringify(defaultHours),
    pickupSlotDuration: 30,
    maxBookingsPerSlot: 2,
    minPrepNoticeHours: 48,
    allowSameDayBooking: false,
    isActive: true,
  },
  {
    name: "Queen St BB — James Street",
    address: "18 James Street, Fortitude Valley QLD 4006",
    phone: "+61 7 3456 7890",
    email: "jamesst@queenstbb.com",
    openingHours: JSON.stringify(defaultHours),
    pickupSlotDuration: 30,
    maxBookingsPerSlot: 3,
    minPrepNoticeHours: 24,
    allowSameDayBooking: true,
    isActive: true,
  },
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Seeding 3 branches...");

  for (const branch of branches) {
    await connection.execute(
      `INSERT INTO branches (name, address, phone, email, openingHours, pickupSlotDuration, maxBookingsPerSlot, minPrepNoticeHours, allowSameDayBooking, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE address = VALUES(address)`,
      [
        branch.name,
        branch.address,
        branch.phone,
        branch.email,
        branch.openingHours,
        branch.pickupSlotDuration,
        branch.maxBookingsPerSlot,
        branch.minPrepNoticeHours,
        branch.allowSameDayBooking ? 1 : 0,
        branch.isActive ? 1 : 0,
      ]
    );
    console.log(`  ✓ ${branch.name}`);
  }

  await connection.end();
  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
