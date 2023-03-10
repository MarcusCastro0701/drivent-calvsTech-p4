import { prisma } from "@/config";

async function retrieveBooking(userId: number){


    const retrieve = await prisma.booking.findMany({

        where: {
            userId: userId
        },
        include: {
            Room: true
        }

    })

    return retrieve 
    
}

async function insertBooking(userId: number, roomId: number){

    const insert = await prisma.booking.create({
        data:{
            userId: userId,
            roomId: roomId
        }
    })

    return insert

}

async function updateBooking(bookingId: number, roomId: number){

    const update = await prisma.booking.update({
        where: {
            id: bookingId
        },
        data: {
            roomId: roomId
        }
    })

    return update

}

async function retrieveBookingByBookingId(bookingId: number){

    const get = await prisma.booking.findFirst({
        where: {id: bookingId}
    })

    return get

}

const bookingRepository = {
    retrieveBooking,
    insertBooking,
    updateBooking,
    retrieveBookingByBookingId
}

export default bookingRepository