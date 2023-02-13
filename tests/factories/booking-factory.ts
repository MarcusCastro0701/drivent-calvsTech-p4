import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createBooking(userId: number, roomId: number){

    const create = await prisma.booking.create({
        data: {
            userId: userId,
            roomId: roomId
        }
    })
    
    return create

}

export async function createManyBookings(userId: number, roomId: number){
    const create = await prisma.booking.createMany({
        data: [
            {
                userId: userId,
                roomId: roomId
            },
            {
                userId: userId,
                roomId: roomId
            },
            {
                userId: userId,
                roomId: roomId
            }
        ]
    })

    return create
    
}