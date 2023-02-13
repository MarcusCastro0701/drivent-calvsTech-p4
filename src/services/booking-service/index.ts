import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import userRepository from "@/repositories/user-repository";
import ticketRepository from "@/repositories/ticket-repository";
import paymentRepository from "@/repositories/payment-repository";
import roomRepository from "@/repositories/room-repository";
import { notFoundError, forbidenError } from "@/errors";

async function getBooking(userId: number){

    const verifyUser = await userRepository.findById(userId)

    if(verifyUser.Booking.length !== 0){
        
        const get = await bookingRepository.retrieveBooking(userId)

        return get
    }

    if(verifyUser.Booking.length === 0){
        throw notFoundError()
    }
    
}

async function postBooking(userId: number, roomId: number): Promise<any>{

    
    const verificaEnrollment = await enrollmentRepository.findByUserId(userId)
    
    if(!verificaEnrollment){
        throw forbidenError()
    }
    
    const verificaTicket = await ticketRepository.findTicketByEnrollmentId(verificaEnrollment.id)
    
    
    if(!verificaTicket){
        throw forbidenError()
    }
    
    const verificaPayment = await paymentRepository.findPaymentByTicketId(verificaTicket.id)
    
    if(verificaTicket.TicketType.includesHotel === false || verificaTicket.TicketType.isRemote === true || !verificaPayment){
        throw forbidenError()
    }
    
    const verificaRoom = await roomRepository.findRoomById(roomId)
    
    if(!verificaRoom){
        throw notFoundError()
    }
    
    if(verificaRoom.Booking.length === verificaRoom.capacity){
        throw forbidenError()
    }

    
    const post = await bookingRepository.insertBooking(userId, roomId)
    
    return post.id

}

async function changeBooking(roomId: number, bookingId: number, userId: number): Promise<any>{

    const verificaEnrollment = await enrollmentRepository.findByUserId(userId)
    
    if(!verificaEnrollment){
        //console.log("!verificaenrollment")
        throw forbidenError()
    }
    
    const verificaTicket = await ticketRepository.findTicketByEnrollmentId(verificaEnrollment.id)
    
    if(!verificaTicket){
        //console.log("!verificaticket")
        throw forbidenError()
    }

    const verifyUser = await userRepository.findById(userId)

    if(verifyUser.Booking.length === 0){
        //console.log("verifyUser.Booking.length === 0")
        throw forbidenError()
    }

    const verifyRoom = await roomRepository.findRoomById(roomId)

    if(!verifyRoom){
        //console.log("!verify room")
        throw notFoundError()
    }

    if(verifyRoom.Booking.length === verifyRoom.capacity){
        //console.log("verifyRoom.Booking.length === verifyRoom.capacity")
        throw forbidenError()
    }

    const change = await bookingRepository.updateBooking(bookingId, roomId)

    return change.id

}

const bookingService = {
    getBooking,
    postBooking,
    changeBooking
}

export default bookingService