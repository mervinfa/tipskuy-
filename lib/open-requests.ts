import { OpenRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/http";
import { findCity } from "@/lib/regions";
import { parseStorageUrl } from "@/lib/storage/url";
import type { CreateOpenRequestInput } from "@/types/schemas/order";

const OPEN_REQUEST_TTL_DAYS = 7;

function requireCityRef(cityCode: string) {
  const ref = findCity(cityCode);
  if (!ref) {
    throw new AppError(422, "INVALID_CITY_CODE", `Kode kota ${cityCode} tidak dikenali`);
  }
  return ref;
}

export async function createOpenRequest(userId: string, input: CreateOpenRequestInput, clock: Date = new Date()) {
  const origin = requireCityRef(input.originCityCode);
  const destination = requireCityRef(input.destCityCode);
  if (input.imageUrl) {
    parseStorageUrl(input.imageUrl, "items", userId);
  }
  const expiresAt = new Date(clock.getTime() + OPEN_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000);
  const created = await prisma.openRequest.create({
    data: {
      customerId: userId,
      serviceType: input.serviceType,
      originCityCode: origin.cityCode,
      originCity: origin.city,
      destCityCode: destination.cityCode,
      destCity: destination.city,
      description: input.description,
      imageUrl: input.imageUrl,
      expiresAt,
    },
  });
  return created;
}

export async function listOpenRequests(query: {
  originCityCode?: string;
  destCityCode?: string;
  page: number;
  pageSize: number;
}) {
  const where = {
    status: OpenRequestStatus.OPEN,
    expiresAt: { gt: new Date() },
    ...(query.originCityCode ? { originCityCode: query.originCityCode } : {}),
    ...(query.destCityCode ? { destCityCode: query.destCityCode } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.openRequest.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.openRequest.count({ where }),
  ]);
  return { items: rows, page: query.page, pageSize: query.pageSize, total };
}
