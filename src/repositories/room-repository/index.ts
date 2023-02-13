import { prisma } from "@/config";

async function findRoomById(roomId: number){

    const find = await prisma.room.findFirst({
        where: {
            id: roomId
        },
        include: {
            Booking: true
        }
    })
    
    return find

}

const roomRepository = {
    findRoomById,
}

export default roomRepository