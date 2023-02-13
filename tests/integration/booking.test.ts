import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import e from "express";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createPayment,
  generateCreditCardData,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createHotel,
  createRoomWithHotelId,
  createBooking,
  createTicketTypeWithNoHotel,
  createManyBookings,
  createBookingWithWrongUserId
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
    await init();
  });
  
  beforeEach(async () => {
    await cleanDb();
  });

const server = supertest(app);


describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
});

describe("when token is valid", () => {
    it("should respond with status 200 and the user booking", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id, createdRoom.id)
        
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
        
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual([
            {
                id: createdBooking.id,
                Room: {
                  id: createdRoom.id,
                  name: createdRoom.name,
                  capacity: createdRoom.capacity,
                  hotelId: createdRoom.hotelId,
                  createdAt: createdRoom.createdAt.toISOString(),
                  updatedAt: createdRoom.updatedAt.toISOString()
                }
            }
        ])
    });

    it("should respond with status 404 user has no booking", async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

})

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
});

describe("when token is valid", () => {
  it("should respond with status 200 and the bookingId", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: createdRoom.id});

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toMatchObject({
      bookingId: expect.any(Number)
    })
  });

  it("should respond with status 403 if there is no enrollment", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    
  });

  it("should respond with status 403 if there is no ticket", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    
  });

  it("should respond with status 403 if ticket is remote", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeRemote();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should respond with status 403 if ticket do not includes hotel", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithNoHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should respond with status 403 if there is no payment", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should respond with status 200 and the bookingId", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    await createHotel();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should respond with status 403 if there is no vacancy for the room", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    await createManyBookings(user.id, createdRoom.id)

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: createdRoom.id});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    
  });

  it("should respond with status 400 if there is no body", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    
    const response = await server.post(`/booking`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  
  });

  it("should respond with status 400 if invalid roomId - invalid partition (limit value -1)", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    
    const response = await server.post(`/booking`).set("Authorization", `Bearer ${token}`).send({roomId: 0});

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  
  });

})

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put(`/booking/${1}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
});

describe("when token is valid", () => {
  it("should respond with status 200 and the bookingId", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom.id)

    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({roomId: createdRoom.id});

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toMatchObject({
      bookingId: expect.any(Number)
    })
  });

  it("should respond with status 404 if the booking does not have the given userId", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createdBookingWrong = await createBookingWithWrongUserId(user.id, createdRoom.id)
    const createdBooking = await createBooking(user.id, createdRoom.id)

    const response = await server.put(`/booking/${createdBookingWrong.id}`).set("Authorization", `Bearer ${token}`).send({roomId: createdRoom.id});

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    
  });

  it("should respond with status 403 if there is no enrollment", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  
  });

  it("should respond with status 403 if there is no ticket", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);

    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  
  });

  it("should respond with status 403 if user has no booking", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);

    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({roomId: createdRoom.id});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  
  });

  it("should respond with status 404 if room id does no exist", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom.id)
    
    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({roomId: Number(createdRoom.id) + 1});

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  
  });

  it("should respond with status 404 if there is no vacancy for the room", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    await createManyBookings(user.id, createdRoom.id)
    
    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({roomId: createdRoom.id});

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  
  });

  it("should respond with status 400 if there is no body", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    
    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  
  });

  it("should respond with status 400 if invalid bookingId - invalid partition (limit value - 1)", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    
    const response = await server.put(`/booking/${0}`).set("Authorization", `Bearer ${token}`).send({roomId: 1});

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  
  });

  it("should respond with status 400 if invalid roomId - invalid partition (limit value - 1)", async () => {

    const user = await createUser();
    const token = await generateValidToken(user);
    
    const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({roomId: 0});

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  
  });

})



