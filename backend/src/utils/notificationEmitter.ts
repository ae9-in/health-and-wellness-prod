import { Prisma } from "@prisma/client";
import { NotificationType } from '@prisma/client';
import { Server } from 'socket.io';
import prisma from '../lib/prisma';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];



interface NotificationOptions {
  userId: string;
  type: NotificationType;
  message: string;
  metadata?: Record<string, unknown>;
}


export async function notifyUser({ userId, type, message, metadata }: NotificationOptions, io?: Server) {

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      message,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  if (io) {
    io.emit(`notification:${userId}`, notification);
  }

  return notification;
}
