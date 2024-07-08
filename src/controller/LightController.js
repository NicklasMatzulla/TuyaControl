/*
 * Copyright (c) 2024 Nicklas Matzulla
 */

import TuyAPI from 'tuyapi';

const device = new TuyAPI({
    id: "device_id",
    key: "device_token"
});

let isConnected = false;
let lampStatus = null;
let reconnectInterval = null;
let commandQueue = [];
let currentCommand = null;
let currentBrightness = 0

function connectToDevice() {
    console.log("Connecting to device...");
    return new Promise((resolve, reject) => {
        device.find()
            .then(() => {
                device.connect();
                device.once('data', data => {
                    if (data.dps && data.dps['20'] !== undefined) {
                        lampStatus = data.dps['20'];
                    }
                    if (data.dps && data.dps['22'] !== undefined) {
                        currentBrightness = data.dps['22'];
                    }
                    isConnected = true;
                    startListeningForStatus();
                    console.log("Device connected.");
                    resolve();
                });
            })
            .catch(err => {
                console.error('Error connecting to device:', err);
                reject(err);
            });
    });
}

function startListeningForStatus() {
    device.on('dp-refresh', data => {
        if (data.dps && data.dps['20'] !== undefined) {
            lampStatus = data.dps['20'];
        }
        if (data.dps && data.dps['22'] !== undefined) {
            currentBrightness = data.dps['22'];
        }
    });
    device.on('disconnected', () => {
        console.log("Device disconnected.");
        isConnected = false;
        // Attempt to reconnect after 5 seconds
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                console.log("Attempting to reconnect...");
                connectToDevice()
                    .then(() => {
                        clearInterval(reconnectInterval);
                        reconnectInterval = null;
                    })
                    .catch(err => {
                        console.error('Reconnection attempt failed:', err);
                    });
            }, 5000); // Retry every 5 seconds
        }
    });
}

function processQueue() {
    if (commandQueue.length > 0 && isConnected && !currentCommand) {
        const { command, params } = commandQueue.shift();
        currentCommand = command(...params)
            .then(() => {
                currentCommand = null;
                processQueue();
            })
            .catch(err => {
                console.error('Error executing command:', err);
                currentCommand = null;
                processQueue();
            });
    }
}

function enqueueCommand(command, ...params) {
    commandQueue.push({ command, params });
    if (commandQueue.length === 1 && !currentCommand) {
        processQueue();
    }
}

function isTurnedOn() {
    return lampStatus
}

function turnOn() {
    return new Promise((resolve, reject) => {
        if (isConnected) {
            device.set({ dps: 20, set: true })
                .then(() => {
                    resolve();
                })
                .catch(err => {
                    console.error('Error turning lamp on:', err);
                    reject(err);
                });
        }
    });
}

function turnOff() {
    return new Promise((resolve, reject) => {
        if (isConnected) {
            device.set({ dps: 20, set: false })
                .then(() => {
                    resolve();
                })
                .catch(err => {
                    console.error('Error turning lamp off:', err);
                    reject(err);
                });
        }
    });
}

function toggle() {
    if (isConnected) {
        if (lampStatus) {
            enqueueCommand(turnOff);
        } else {
            enqueueCommand(turnOn);
        }
    }
}

function setBrightness(level) {
    return new Promise((resolve, reject) => {
        if (isConnected) {
            if (level < 1 || level > 1000) {
                reject(new Error('Brightness level must be between 1 and 1000'));
            } else {
                device.set({ dps: 22, set: level })
                    .then(() => {
                        currentBrightness = level;
                        resolve();
                    })
                    .catch(err => {
                        console.error('Error setting brightness:', err);
                        reject(err);
                    });
            }
        }
    });
}

function getBrightness() {
    return currentBrightness
}

function increaseBrightness(times) {
    currentBrightness = Math.min(Math.max(currentBrightness + 10*times, 10), 1000);
    commandQueue = commandQueue.filter(command => command.command !== setBrightness);
    enqueueCommand(setBrightness, currentBrightness);
    return currentBrightness
}

function decreaseBrightness(times) {
    currentBrightness = Math.min(Math.max(currentBrightness - 10*times, 10), 1000);
    commandQueue = commandQueue.filter(command => command.command !== setBrightness);
    enqueueCommand(setBrightness, currentBrightness);
    return currentBrightness
}

// Export the functions
export { connectToDevice, isTurnedOn, toggle, getBrightness, increaseBrightness, decreaseBrightness };
