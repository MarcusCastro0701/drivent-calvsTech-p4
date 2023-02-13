import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function findBooking(req: AuthenticatedRequest, res: Response){

    const id = req.userId;
    
    const userId = Number(id)

    try {
        
        const find = await bookingService.getBooking(userId)

        const body = [
            {
                id: find[0].id,
                Room: find[0].Room
            }
        ]

        return res.status(httpStatus.OK).send(body)

    } catch (error) {
        
        //console.log(error)
        if(error.name === "NotFoundError"){
            return res.sendStatus(httpStatus.NOT_FOUND)
        }

    }

}

export async function createBooking(req: AuthenticatedRequest, res: Response){

    const uid = req.userId;
    const rid = req.body.roomId;

    if(!rid || Number(rid) < 1){
        //console.log("!rid || Number(rid) < 1")
        return res.sendStatus(httpStatus.BAD_REQUEST)
    }

    const userId = Number(uid);
    const roomId = Number(rid);

    try {
        
        const create = await bookingService.postBooking(userId, roomId)


        return res.status(httpStatus.OK).send({bookingId: create})

    } catch (error) {
        
        //console.log(error, "ERRO EM CREATE BOOKING")
        if(error.name === "NotFoundError"){
            return res.sendStatus(httpStatus.NOT_FOUND)
        }
        if(error.name === "ForbiddenError"){
            res.sendStatus(httpStatus.FORBIDDEN)
        }
        
    }


}

export async function changeRoomId(req: AuthenticatedRequest, res: Response){

    const uid = req.userId;
    const bid = req.params.bookingId;
    const rid = req.body.roomId;

    if(!rid || Number(bid) < 1 || Number(rid) < 1){
        //console.log("!rid || Number(bid) < 1 || Number(rid) < 1")
        return res.sendStatus(httpStatus.BAD_REQUEST)
    }

    const userId = Number(uid);
    const bookingId = Number(bid);
    const roomId = Number(rid);

    try {
        
        const change = await bookingService.changeBooking(roomId, bookingId, userId)

        return res.status(httpStatus.OK).send({bookingId: change})

    } catch (error) {
        
        //console.log(error, "ERRO EM CHANGE ROOM ID")
        if(error.name === "NotFoundError"){
            return res.sendStatus(httpStatus.NOT_FOUND)
        }
        if(error.name === "ForbiddenError"){
            res.sendStatus(httpStatus.FORBIDDEN)
        }

    }

}