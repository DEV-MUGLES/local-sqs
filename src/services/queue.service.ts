import { formatBatchMessage } from '../common';
import { Message } from '../models';
import { queueRepository } from '../repositories';

const checkMessageContent = (query: Record<string, string>) => {
  const MSG_CONTENT_REGEX =
    /^[\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\U00010000-\U0010FFFF]*$/;

  if (Object.values(query).some((value) => !MSG_CONTENT_REGEX.test(value))) {
    throw new Error('Message contains invalid characters');
  }
};

const send = (queueName: string, query: Record<string, string>) => {
  checkMessageContent(query);

  const message = new Message(query);
  queueRepository.push(queueName, message);

  return message.toResponse();
};

const sendBatch = (queueName: string, query: Record<string, string>) => {
  checkMessageContent(query);

  const messages = formatBatchMessage(query).map(
    (message) => new Message(message)
  );
  queueRepository.push(queueName, messages);

  return {
    SendMessageBatchResultEntry: messages.map((message) =>
      message.toResponse()
    ),
  };
};

const receive = (queueName: string, query: Record<string, string>) => {
  const { MaxNumberOfMessages = 1 } = query;

  const messages = queueRepository.pop(queueName, Number(MaxNumberOfMessages));

  return {
    Message: messages.map((message) => message.toOutput()),
  };
};

export const queueService = {
  send,
  sendBatch,
  receive,
};