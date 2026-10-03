/**
 * Dados de exemplo (fictícios) para o Hotel.Operations.
 *
 * ATENÇÃO: este script APAGA todos os dados das tabelas da aplicação e volta a
 * criá-los. É a forma de repor a demo. Corre-o apenas contra a base de dados
 * que aponta o DATABASE_URL do teu .env.
 *
 *   npm run db:seed     (o mesmo que: npx prisma db seed)
 *
 * As datas são relativas a "hoje", por isso o estado do dashboard (check-ins,
 * check-outs, manutenções em atraso) fica sempre coerente no dia em que o
 * script corre.
 */
import "dotenv/config";
import {
  PrismaClient,
  RoomStatus,
  ReservationStatus,
  OperationType,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceHistoryType,
} from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Data relativa a hoje, à hora indicada (hora local).
function at(daysFromToday: number, hour: number) {
  const result = new Date();
  result.setDate(result.getDate() + daysFromToday);
  result.setHours(hour, 0, 0, 0);
  return result;
}

function nights(checkIn: Date, checkOut: Date) {
  return Math.round(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
  );
}

async function clearDatabase() {
  // Ordem: primeiro as tabelas que dependem de outras.
  await prisma.maintenanceHistory.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("A repor os dados de exemplo...");
  await clearDatabase();

  // --------------------------------------------------
  // USERS (equipa fictícia)
  // --------------------------------------------------

  const manager = await prisma.user.create({
    data: {
      id: "user_manager",
      name: "Dinis Fragata",
      email: "admin@dinisfragata.pt",
      role: "PROPERTY_MANAGER",
    },
  });

  const technician = await prisma.user.create({
    data: {
      id: "user_technician",
      name: "Miguel Santos",
      email: "miguel.santos@example.com",
      role: "MAINTENANCE",
    },
  });

  const housekeeper = await prisma.user.create({
    data: {
      id: "user_housekeeping",
      name: "Rita Carvalho",
      email: "rita.carvalho@example.com",
      role: "HOUSEKEEPING",
    },
  });

  // --------------------------------------------------
  // ROOMS
  // O estado de cada quarto tem de bater com as reservas abaixo:
  // OCCUPIED = reserva CHECKED_IN, CLEANING = check-out feito hoje,
  // MAINTENANCE = pedido de manutenção aberto que bloqueia o quarto.
  // --------------------------------------------------

  const roomsData = [
    { number: "201", floor: 2, status: RoomStatus.AVAILABLE, capacity: 2, pricePerNight: 120 },
    { number: "202", floor: 2, status: RoomStatus.OCCUPIED, capacity: 2, pricePerNight: 135 },
    { number: "203", floor: 2, status: RoomStatus.CLEANING, capacity: 2, pricePerNight: 110 },
    { number: "204", floor: 2, status: RoomStatus.OCCUPIED, capacity: 3, pricePerNight: 160 },
    { number: "205", floor: 2, status: RoomStatus.AVAILABLE, capacity: 2, pricePerNight: 125 },
    { number: "301", floor: 3, status: RoomStatus.OCCUPIED, capacity: 2, pricePerNight: 145 },
    { number: "302", floor: 3, status: RoomStatus.MAINTENANCE, capacity: 2, pricePerNight: 130 },
    { number: "303", floor: 3, status: RoomStatus.AVAILABLE, capacity: 4, pricePerNight: 190 },
    { number: "401", floor: 4, status: RoomStatus.OCCUPIED, capacity: 2, pricePerNight: 175 },
    { number: "402", floor: 4, status: RoomStatus.AVAILABLE, capacity: 2, pricePerNight: 180 },
    { number: "510", floor: 5, status: RoomStatus.OCCUPIED, capacity: 3, pricePerNight: 210 },
  ];

  const roomByNumber: Record<string, { id: string; pricePerNight: number }> = {};

  for (const data of roomsData) {
    const room = await prisma.room.create({ data });
    roomByNumber[data.number] = { id: room.id, pricePerNight: data.pricePerNight };
  }

  // --------------------------------------------------
  // GUESTS
  // --------------------------------------------------

  const guestsData = [
    {
      key: "eleanor",
      firstName: "Eleanor",
      lastName: "Vance",
      email: "eleanor.vance@example.com",
      phone: "+44 7700 900101",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: "Prefers a quiet room away from the elevator.",
    },
    {
      key: "arthur",
      firstName: "Arthur",
      lastName: "Pendelton",
      email: "arthur.pendelton@example.com",
      phone: "+44 7700 900102",
      preferredLanguage: "English",
      preferredRoomType: "Suite",
      specialRequests: "Requests early breakfast when available.",
    },
    {
      key: "theodore",
      firstName: "Theodore",
      lastName: "Montague",
      email: "theodore.montague@example.com",
      phone: "+44 7700 900103",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: "Non-feather pillows.",
    },
    {
      key: "clara",
      firstName: "Clara",
      lastName: "Whitfield",
      email: "clara.whitfield@example.com",
      phone: "+1 202 555 0104",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: "Prefers minimal room noise.",
    },
    {
      key: "james",
      firstName: "James",
      lastName: "Sterling",
      email: "james.sterling@example.com",
      phone: "+44 7700 900105",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: "Late check-out when possible.",
    },
    {
      key: "sophia",
      firstName: "Sophia",
      lastName: "Whitmore",
      email: "sophia.whitmore@example.com",
      phone: "+44 7700 900106",
      preferredLanguage: "English",
      preferredRoomType: "Suite",
      specialRequests: "Celebrating an anniversary during the stay.",
    },
    {
      key: "oliver",
      firstName: "Oliver",
      lastName: "Harrington",
      email: "oliver.harrington@example.com",
      phone: "+44 7700 900107",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: "Prefers a room on a higher floor.",
    },
    {
      key: "amelia",
      firstName: "Amelia",
      lastName: "Crawford",
      email: "amelia.crawford@example.com",
      phone: "+44 7700 900108",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: "Prefers extra pillows.",
    },
    {
      key: "harold",
      firstName: "Harold",
      lastName: "Bennett",
      email: "harold.bennett@example.com",
      phone: "+44 7700 900109",
      preferredLanguage: "English",
      preferredRoomType: "Double",
      specialRequests: null,
    },
  ];

  const guestByKey: Record<string, { id: string; name: string }> = {};

  for (const { key, ...data } of guestsData) {
    const guest = await prisma.guest.create({ data });
    guestByKey[key] = { id: guest.id, name: `${data.firstName} ${data.lastName}` };
  }

  // --------------------------------------------------
  // RESERVATIONS
  // O preço total é sempre preço/noite x noites.
  // --------------------------------------------------

  const reservationsData = [
    // Hóspedes atualmente alojados
    { key: "eleanor", room: "202", checkIn: at(0, 14), checkOut: at(3, 11), guests: 2, status: ReservationStatus.CHECKED_IN },
    { key: "theodore", room: "204", checkIn: at(0, 15), checkOut: at(4, 11), guests: 2, status: ReservationStatus.CHECKED_IN },
    { key: "sophia", room: "301", checkIn: at(-1, 15), checkOut: at(2, 11), guests: 2, status: ReservationStatus.CHECKED_IN },
    { key: "oliver", room: "401", checkIn: at(-2, 14), checkOut: at(1, 11), guests: 2, status: ReservationStatus.CHECKED_IN },
    { key: "amelia", room: "510", checkIn: at(-1, 14), checkOut: at(2, 12), guests: 3, status: ReservationStatus.CHECKED_IN },
    // Check-out feito hoje (o quarto 203 está em limpeza)
    { key: "harold", room: "203", checkIn: at(-3, 15), checkOut: at(0, 11), guests: 2, status: ReservationStatus.CHECKED_OUT },
    // Próximas chegadas (a da 402 é hoje, referida nos AI insights)
    { key: "arthur", room: "402", checkIn: at(0, 16), checkOut: at(3, 11), guests: 2, status: ReservationStatus.CONFIRMED },
    { key: "clara", room: "201", checkIn: at(2, 15), checkOut: at(5, 11), guests: 2, status: ReservationStatus.CONFIRMED },
    { key: "james", room: "205", checkIn: at(5, 14), checkOut: at(8, 11), guests: 2, status: ReservationStatus.PENDING },
  ];

  const reservationByKey: Record<string, string> = {};

  for (const item of reservationsData) {
    const room = roomByNumber[item.room];
    const reservation = await prisma.reservation.create({
      data: {
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        guestsCount: item.guests,
        status: item.status,
        totalPrice: room.pricePerNight * nights(item.checkIn, item.checkOut),
        guestId: guestByKey[item.key].id,
        roomId: room.id,
      },
    });
    reservationByKey[item.key] = reservation.id;
  }

  // --------------------------------------------------
  // OPERATIONS (check-ins e check-outs registados)
  // Uma operação por cada reserva CHECKED_IN / CHECKED_OUT, à hora do
  // check-in / check-out. Hoje: 2 check-ins (202, 204) e 1 check-out (203).
  // --------------------------------------------------

  const operationsData = [
    { type: OperationType.CHECK_IN, key: "eleanor", room: "202", time: at(0, 14) },
    { type: OperationType.CHECK_IN, key: "theodore", room: "204", time: at(0, 15) },
    { type: OperationType.CHECK_OUT, key: "harold", room: "203", time: at(0, 11) },
    { type: OperationType.CHECK_IN, key: "sophia", room: "301", time: at(-1, 15) },
    { type: OperationType.CHECK_IN, key: "amelia", room: "510", time: at(-1, 14) },
    { type: OperationType.CHECK_IN, key: "oliver", room: "401", time: at(-2, 14) },
    { type: OperationType.CHECK_IN, key: "harold", room: "203", time: at(-3, 15) },
  ];

  for (const item of operationsData) {
    await prisma.operation.create({
      data: {
        type: item.type,
        guestName: guestByKey[item.key].name,
        time: item.time,
        roomId: roomByNumber[item.room].id,
        reservationId: reservationByKey[item.key],
      },
    });
  }

  // --------------------------------------------------
  // MAINTENANCE
  // --------------------------------------------------

  const maintenanceData = [
    {
      id: "maintenance_ac_inspection",
      title: "Air conditioning inspection",
      description: "AC unit making unusual noise.",
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.HIGH,
      dueDate: at(1, 17),
      roomId: roomByNumber["302"].id,
      assignedToId: technician.id,
      completedAt: null,
    },
    {
      id: "maintenance_faucet_replacement",
      title: "Bathroom faucet replacement",
      description: "Guest reported a leaking faucet.",
      status: MaintenanceStatus.IN_PROGRESS,
      priority: MaintenancePriority.URGENT,
      dueDate: at(0, 23),
      roomId: roomByNumber["204"].id,
      assignedToId: technician.id,
      completedAt: null,
    },
    {
      id: "maintenance_bedside_lamp",
      title: "Replace bedside lamp",
      description: "Lamp not powering on.",
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.MEDIUM,
      dueDate: at(3, 12),
      roomId: roomByNumber["201"].id,
      assignedToId: null,
      completedAt: null,
    },
    {
      id: "maintenance_window_lock",
      title: "Window lock inspection",
      description: "Check window lock before next arrival.",
      status: MaintenanceStatus.COMPLETED,
      priority: MaintenancePriority.LOW,
      dueDate: at(-2, 17),
      roomId: roomByNumber["401"].id,
      assignedToId: technician.id,
      completedAt: at(-3, 16),
    },
    {
      id: "maintenance_tv_remote",
      title: "TV remote replacement",
      description: "Remote control batteries and buttons faulty.",
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.HIGH,
      dueDate: at(5, 14),
      roomId: roomByNumber["510"].id,
      assignedToId: technician.id,
      completedAt: null,
    },
  ];

  for (const data of maintenanceData) {
    await prisma.maintenance.create({ data });
  }

  // --------------------------------------------------
  // MAINTENANCE HISTORY
  // --------------------------------------------------

  const T = MaintenanceHistoryType;
  const assignedTo = `Maintenance request assigned to ${technician.name}.`;

  const historyData = [
    { m: "ac_inspection", type: T.CREATED, description: "Maintenance request created.", by: manager.id },
    { m: "ac_inspection", type: T.ASSIGNED, description: assignedTo, by: manager.id },
    { m: "ac_inspection", type: T.PRIORITY_CHANGED, description: "Priority set to HIGH.", by: manager.id },

    { m: "faucet_replacement", type: T.CREATED, description: "Maintenance request created.", by: housekeeper.id },
    { m: "faucet_replacement", type: T.ASSIGNED, description: assignedTo, by: manager.id },
    { m: "faucet_replacement", type: T.PRIORITY_CHANGED, description: "Priority set to URGENT.", by: manager.id },
    { m: "faucet_replacement", type: T.STATUS_CHANGED, description: "Status changed to IN_PROGRESS.", by: technician.id },

    { m: "bedside_lamp", type: T.CREATED, description: "Maintenance request created.", by: housekeeper.id },

    { m: "window_lock", type: T.CREATED, description: "Maintenance request created.", by: manager.id },
    { m: "window_lock", type: T.ASSIGNED, description: assignedTo, by: manager.id },
    { m: "window_lock", type: T.STATUS_CHANGED, description: "Status changed to IN_PROGRESS.", by: technician.id },
    { m: "window_lock", type: T.COMPLETED, description: "Maintenance request marked as completed.", by: technician.id },

    { m: "tv_remote", type: T.CREATED, description: "Maintenance request created.", by: housekeeper.id },
    { m: "tv_remote", type: T.ASSIGNED, description: assignedTo, by: manager.id },
    { m: "tv_remote", type: T.PRIORITY_CHANGED, description: "Priority set to HIGH.", by: manager.id },
  ];

  for (const item of historyData) {
    await prisma.maintenanceHistory.create({
      data: {
        type: item.type,
        description: item.description,
        maintenanceId: `maintenance_${item.m}`,
        userId: item.by,
      },
    });
  }

  // --------------------------------------------------
  // AI INSIGHTS
  // São linhas de exemplo: ainda não são geradas por um modelo.
  // Cada uma refere um quarto/hóspede que existe nos dados acima.
  // --------------------------------------------------

  await prisma.aIInsight.createMany({
    data: [
      {
        room: "Room 204",
        title: "Guest preference detected",
        text: "Mr. Montague prefers non-feather pillows. Housekeeping notified.",
        action: "CONFIRM",
        confirmed: false,
      },
      {
        room: "Room 301",
        title: "Celebration detected",
        text: "Anniversary celebration. Champagne delivery scheduled for 18:00.",
        action: "SCHEDULED",
        confirmed: true,
      },
      {
        room: "Room 402",
        title: "Early arrival",
        text: "Guest arriving 45 minutes earlier than originally expected.",
        action: "REVIEW",
        confirmed: false,
      },
      {
        room: "Room 302",
        title: "Maintenance risk",
        text: "Recurring AC issue detected. Consider scheduling a preventive inspection.",
        action: "REVIEW",
        confirmed: false,
      },
    ],
  });

  console.log("Dados repostos com sucesso:");
  console.log(`  ${roomsData.length} quartos, ${guestsData.length} hóspedes, ${reservationsData.length} reservas,`);
  console.log(`  ${operationsData.length} operações, ${maintenanceData.length} pedidos de manutenção.`);
}

main()
  .catch((error) => {
    console.error("O seed falhou:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
