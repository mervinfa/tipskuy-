import { OrderStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/http";
import { env } from "@/lib/env";
import { findCity } from "@/lib/regions";
import type { CreateTripInput, TripSearchInput } from "@/types/schemas/trip";

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.WAITING_DRIVER_PRICING,
  OrderStatus.WAITING_CUSTOMER_PAYMENT,
  OrderStatus.PAID_HELD_IN_ESCROW,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED_PENDING_CONFIRMATION,
  OrderStatus.DISPUTED,
];

function requireCityRef(cityCode: string) {
  const ref = findCity(cityCode);
  if (!ref) {
    throw new AppError(422, "INVALID_CITY_CODE", `Kode kota ${cityCode} tidak dikenali`);
  }
  return ref;
}

export async function createTrip(userId: string, input: CreateTripInput) {
  const driverProfile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driverProfile) {
    throw new AppError(409, "DRIVER_PROFILE_MISSING", "Profil driver tidak ditemukan");
  }
  if (env.VERIFICATION_REQUIRED && driverProfile.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new AppError(403, "DRIVER_NOT_VERIFIED", "Driver belum terverifikasi");
  }
  const origin = requireCityRef(input.origin.cityCode);
  const destination = requireCityRef(input.destination.cityCode);
  const trip = await prisma.tripListing.create({
    data: {
      driverId: driverProfile.id,
      serviceType: input.serviceType,
      originProvince: origin.province,
      originCityCode: origin.cityCode,
      originCity: origin.city,
      originLat: origin.lat,
      originLng: origin.lng,
      destProvince: destination.province,
      destCityCode: destination.cityCode,
      destCity: destination.city,
      destLat: destination.lat,
      destLng: destination.lng,
      baseFee: input.baseFee,
      departureAt: input.departureAt ? new Date(input.departureAt) : null,
      notes: input.notes,
    },
  });
  return trip;
}

export async function searchTrips(query: TripSearchInput) {
  const where = {
    isActive: true,
    ...(query.originCityCode ? { originCityCode: query.originCityCode } : {}),
    ...(query.destCityCode ? { destCityCode: query.destCityCode } : {}),
    ...(query.serviceType ? { serviceType: query.serviceType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.tripListing.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        driver: {
          select: {
            id: true,
            vehicleType: true,
            verificationStatus: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.tripListing.count({ where }),
  ]);
  const items = rows.map((trip) => ({
    id: trip.id,
    serviceType: trip.serviceType,
    originProvince: trip.originProvince,
    originCity: trip.originCity,
    destProvince: trip.destProvince,
    destCity: trip.destCity,
    baseFee: trip.baseFee,
    departureAt: trip.departureAt,
    notes: trip.notes,
    isActive: trip.isActive,
    createdAt: trip.createdAt,
    driver: {
      id: trip.driver.user.id,
      name: trip.driver.user.name,
      vehicleType: trip.driver.vehicleType,
      verified: trip.driver.verificationStatus === VerificationStatus.VERIFIED,
    },
  }));
  return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function listMyTrips(userId: string, query: { page: number; pageSize: number }) {
  const where = { driver: { userId } };
  const [rows, total] = await Promise.all([
    prisma.tripListing.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        _count: { select: { orders: { where: { status: { in: ACTIVE_ORDER_STATUSES } } } } },
      },
    }),
    prisma.tripListing.count({ where }),
  ]);
  const items = rows.map((trip) => ({
    id: trip.id,
    serviceType: trip.serviceType,
    originCity: trip.originCity,
    destCity: trip.destCity,
    baseFee: trip.baseFee,
    departureAt: trip.departureAt,
    notes: trip.notes,
    isActive: trip.isActive,
    createdAt: trip.createdAt,
    activeOrderCount: trip._count.orders,
  }));
  return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function toggleTrip(userId: string, tripId: string, isActive: boolean) {
  const updated = await prisma.tripListing.updateMany({
    where: { id: tripId, driver: { userId } },
    data: { isActive },
  });
  if (updated.count !== 1) {
    throw new AppError(404, "NOT_FOUND", "Trip tidak ditemukan");
  }
  return { id: tripId, isActive };
}

export async function getTripContact(userId: string, tripId: string) {
  const trip = await prisma.tripListing.findFirst({
    where: { id: tripId },
    include: {
      driver: {
        select: {
          whatsappNumber: true,
          vehicleType: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!trip) {
    throw new AppError(404, "NOT_FOUND", "Trip tidak ditemukan");
  }
  return {
    tripId: trip.id,
    driverName: trip.driver.user.name,
    vehicleType: trip.driver.vehicleType,
    whatsappNumber: trip.driver.whatsappNumber,
  };
}
