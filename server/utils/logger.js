let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function logToUser(userId, message) {
  if (!ioInstance) return;
  ioInstance.to(String(userId)).emit('log', {
    message,
    timestamp: new Date()
  });
}

export function logSystem(message) {
  if (!ioInstance) return;
  ioInstance.emit('systemLog', {
    message,
    timestamp: new Date()
  });
}
