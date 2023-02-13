import faker from "@faker-js/faker";
import { prisma } from "@/config";

//Sabe criar objetos - Hotel do banco
export async function createHotel() {
  return await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.imageUrl(),
    }
  });
}

export async function createRoomWithHotelId(hotelId: number) {
  return prisma.room.create({
    data: {
      name: "1020",
      capacity: 3,
      hotelId: hotelId,
    }
  });
}

export async function createManyRoomsWithHotelId(hotelId: number){

  await prisma.room.createMany({
    data: [
      {
        name: "1020",
        capacity: 3,
        hotelId: hotelId
      },
      {
        name: "1021",
        capacity: 3,
        hotelId: hotelId,
      }
    ]
  });

  const get = await prisma.room.findMany()

  return get

}
