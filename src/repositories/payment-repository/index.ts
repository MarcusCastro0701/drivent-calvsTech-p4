import { prisma } from "@/config";
import { Payment } from "@prisma/client";

async function findPaymentByTicketId(ticketId: number) {

  const find = await prisma.payment.findFirst({
    where: {
      ticketId,
    }
  });

  return find
}

async function createPayment(ticketId: number, params: PaymentParams) {
  return prisma.payment.create({
    data: {
      ticketId,
      ...params,
    }
  });
}

export type PaymentParams = Omit<Payment, "id" | "createdAt" | "updatedAt">

const paymentRepository = {
  findPaymentByTicketId,
  createPayment,
};

export default paymentRepository;
