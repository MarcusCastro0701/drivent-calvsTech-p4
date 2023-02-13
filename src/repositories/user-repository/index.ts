import { prisma } from "@/config";
import { Prisma } from "@prisma/client";

async function findByEmail(email: string, select?: Prisma.UserSelect) {
  const params: Prisma.UserFindUniqueArgs = {
    where: {
      email,
    },
  };

  if (select) {
    params.select = select;
  }

  return prisma.user.findUnique(params);
}

async function create(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.create({
    data,
  });
}

async function findById(userId: number){

  return await prisma.user.findFirst({
    where: {
      id: userId
    },
    include: {
      Booking: true
    }
    
  })

}

const userRepository = {
  findByEmail,
  create,
  findById
};

export default userRepository;
